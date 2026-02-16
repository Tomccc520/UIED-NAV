'use strict';

const Service = require('egg').Service;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const util = require('../util');
const urlUtil = require('../util/urlUtil');
const path = require('path');
const { reqAdminIdKey } = require('../extend/config');
const fs = require('fs');
// 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞。
const sendToWormhole = require('stream-wormhole');
const mkdirp = require('mkdirp');
const dayjs = require('dayjs');

class AlbumService extends Service {
  async cateList(listReq) {
    const { ctx } = this;

    const { type, name } = listReq;

    const where = {
      isDelete: 0,
    };

    if (type > 0) {
      where.type = type;
    }

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const cates = await ctx.model.AlbumCate.findAll({
      where,
      order: [[ 'id', 'DESC' ]],
    });

    const cateResps = cates.map(cate => {
      const cateResp = cate;
      return cateResp;
    });

    const mapList = util.listToTree(
      util.structsToMaps(cateResps),
      'id',
      'pid',
      'children'
    );

    return mapList;
  }

  async cateAdd(addReq) {
    const { ctx } = this;
    try {
      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };
      const cate = new ctx.model.AlbumCate();

      Object.assign(cate, addReq, timeObject);

      await cate.save();
    } catch (err) {
      throw new Error('CateAdd Create err');
    }
  }

  async cateRename(id, name) {
    const { ctx } = this;
    try {
      const cate = await ctx.model.AlbumCate.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!cate) {
        throw new Error('分类已不存在！');
      }

      cate.name = name;

      await cate.save();
    } catch (err) {
      throw new Error('CateRename Save err');
    }
  }

  async cateDel(id) {
    const { ctx } = this;
    try {
      const cate = await ctx.model.AlbumCate.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!cate) {
        throw new Error('分类已不存在！');
      }

      const albumCount = await ctx.model.Album.count({
        where: {
          cid: id,
          isDelete: 0,
        },
      });

      if (albumCount > 0) {
        throw new Error('当前分类正被使用中，不能删除！');
      }

      cate.isDelete = 1;
      cate.deleteTime = Math.floor(Date.now() / 1000);

      await cate.save();
    } catch (err) {
      throw new Error('CateDel Save err');
    }
  }

  async albumList(listReq) {
    const { ctx } = this;

    const { cid, name, type, pageSize, pageNo } = listReq;

    const limit = parseInt(pageSize, 10);
    const offset = pageSize * (pageNo - 1);

    const where = {
      isDelete: 0,
    };

    if (cid > 0) {
      where.cid = cid;
    }

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (type > 0) {
      where.type = type;
    }

    const count = await ctx.model.Album.count({ where });

    const albums = await ctx.model.Album.findAll({
      where,
      limit,
      offset,
      order: [[ 'id', 'DESC' ]],
    });

    const albumResps = albums.map(album => {
      const albumResp = album;
      return albumResp;
    });

    const engine = 'local';

    for (let i = 0; i < albumResps.length; i++) {
      if (engine === 'local') {
        albumResps[i].path = albums[i].uri;
      } else {
        // TODO: 其他 engine
      }
      albumResps[i].uri = urlUtil.toAbsoluteUrl(albums[i].uri);
      albumResps[i].size = util.getFmtSize(albums[i].size);
    }

    return {
      pageNo,
      pageSize,
      count,
      lists: albumResps,
    };
  }

  async albumRename(id, name) {
    const { ctx } = this;
    try {
      const album = await ctx.model.Album.findOne({
        where: {
          id,
          isDelete: 0,
        },
      });

      if (!album) {
        throw new Error('文件丢失！');
      }

      album.name = name;

      await album.save();
    } catch (err) {
      throw new Error('AlbumRename Save err');
    }
  }

  async albumMove(ids, cid) {
    const { ctx } = this;
    try {
      const albums = await ctx.model.Album.findAll({
        where: {
          id: ids,
          isDelete: 0,
        },
      });

      if (albums.length === 0) {
        throw new Error('文件丢失！');
      }

      if (cid > 0) {
        const cate = await ctx.model.AlbumCate.findOne({
          where: {
            id: cid,
            isDelete: 0,
          },
        });

        if (!cate) {
          throw new Error('类目已不存在！');
        }
      }

      await ctx.model.Album.update(
        { cid },
        {
          where: {
            id: ids,
          },
        }
      );
    } catch (err) {
      throw new Error('AlbumMove UpdateColumn err');
    }

  }

  async albumAdd(addReq) {
    const { ctx } = this;
    try {
      const alb = await ctx.model.Album.create(addReq);

      return alb.id;
    } catch (err) {
      throw new Error('AlbumAdd Create err');
    }
  }

  async albumDel(ids) {
    const { ctx } = this;
    try {
      const albums = await ctx.model.Album.findAll({
        where: {
          id: ids,
          isDelete: 0,
        },
      });

      if (albums.length === 0) {
        throw new Error('文件丢失！');
      }

      await ctx.model.Album.update(
        {
          isDelete: 1,
          deleteTime: Math.floor(Date.now() / 1000),
        },
        {
          where: {
            id: ids,
          },
        }
      );
    } catch (err) {
      throw new Error('AlbumDel UpdateColumn err');
    }
  }

  async uploadFile(cid, stream, type = 10) {
    const { ctx } = this;
    try {
      const { url, fileName } = await this.handleUploadFile(stream, type);
      const aid = ctx.session[reqAdminIdKey];

      const stats = fs.statSync('app' + url);
      const fileSizeInBytes = stats.size;

      const addReq = {
        aid,
        cid,
        type,
        uri: url,
        name: fileName,
        size: fileSizeInBytes,
        createTime: Math.floor(Date.now() / 1000),
        updateTime: Math.floor(Date.now() / 1000),
      };

      const albumId = await this.albumAdd(addReq);

      const res = {
        // 设置 res 的字段值...
        id: albumId,
        path: urlUtil.toAbsoluteUrl(url),
      };

      return res;

    } catch (err) {
      throw new Error('uploadImage UpdateColumn err');
    }
  }

  async handleUploadFile(stream, type = 10) {
    const pathDir = type === 10 ? '/public/uploads/image/' : '/public/uploads/video/';
    const targetDir = pathDir + dayjs().format('YYYY-MM-DD');
    const dir = path.join(this.config.baseDir, 'app', targetDir);
    await mkdirp.sync(dir);
    // 定义文件名
    const filename = Date.now() + path.extname(stream.filename).toLocaleLowerCase();
    // 目标文件
    const target = path.join('app', targetDir, filename);
    // 写入流
    const writeStream = fs.createWriteStream(target);
    try {
      // 异步把文件流 写入
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      // 如果出现错误，关闭管道
      await sendToWormhole(stream);
      // 自定义方法
      throw new Error(err);
    }
    // 自定义方法
    const data = {
      url: `${targetDir}/${filename}`,
      fileName: stream.filename,
    };
    return data;
  }

  /**
   * 规范化远程地址（兼容 //cdn.xx.jpg）
   */
  normalizeRemoteUrl(rawUrl = '') {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (value.startsWith('//')) return `https:${value}`;
    return value;
  }

  /**
   * 判断是否为图片链接
   */
  isImageContentType(contentType = '') {
    return /^image\//i.test(String(contentType || '').trim());
  }

  /**
   * 判断是否为本地素材地址
   */
  isLocalMaterialUrl(url = '') {
    const value = String(url || '').trim();
    if (!value) return true;
    if (value.startsWith('/public/uploads/')) return true;
    if (value.startsWith('/api/uploads/')) return true;
    if (/^https?:\/\//i.test(value) && value.includes('/public/uploads/')) return true;
    if (/^https?:\/\//i.test(value) && value.includes('/api/uploads/')) return true;
    return false;
  }

  /**
   * 根据 content-type 与 url 推断图片后缀
   */
  resolveImageExt(contentType = '', url = '') {
    const type = String(contentType || '').toLowerCase();
    const map = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
      'image/x-icon': 'ico',
      'image/vnd.microsoft.icon': 'ico',
    };
    if (map[type]) return map[type];
    const ext = path.extname(String(url || '')).replace('.', '').toLowerCase();
    if (ext && [ 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico' ].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
    return 'jpg';
  }

  /**
   * 下载远程图片为 Buffer
   */
  async fetchRemoteImageBuffer(remoteUrl) {
    const { ctx } = this;
    const requestUrl = this.normalizeRemoteUrl(remoteUrl);
    if (!requestUrl || !/^https?:\/\//i.test(requestUrl)) {
      throw new Error('仅支持 http/https 图片地址');
    }

    const transferConfig = this.config.remoteImageTransfer || {};
    const allowInsecureTls = Boolean(transferConfig.allowInsecureTls);
    const response = await ctx.curl(requestUrl, {
      method: 'GET',
      timeout: 20000,
      followRedirect: true,
      maxRedirects: 3,
      rejectUnauthorized: !allowInsecureTls,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UIED-Nav/1.0; +https://fsuied.com)',
        Accept: 'image/*,*/*;q=0.8',
      },
    });
    if (Number(response.status || 0) >= 400) {
      throw new Error(`下载失败(${response.status})`);
    }
    const contentType = String(response.headers?.['content-type'] || '').split(';')[0].trim();
    if (contentType && !this.isImageContentType(contentType)) {
      throw new Error(`目标不是图片(${contentType})`);
    }
    const buffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data || '');
    if (!buffer.length) {
      throw new Error('远程图片内容为空');
    }
    const maxBytes = Number(transferConfig.maxBytes || 10 * 1024 * 1024);
    if (buffer.length > maxBytes) {
      throw new Error(`图片过大，超过限制(${Math.ceil(maxBytes / 1024 / 1024)}MB)`);
    }
    return {
      buffer,
      contentType,
      finalUrl: requestUrl,
    };
  }

  /**
   * 将远程图片保存到本地素材库
   */
  async saveRemoteImageToAlbum(remoteUrl, cid = 0) {
    const { ctx } = this;
    const { buffer, contentType, finalUrl } = await this.fetchRemoteImageBuffer(remoteUrl);
    const ext = this.resolveImageExt(contentType, finalUrl);
    const targetDir = `/public/uploads/image/${dayjs().format('YYYY-MM-DD')}`;
    const dir = path.join(this.config.baseDir, 'app', targetDir);
    await mkdirp.sync(dir);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const relativeUrl = `${targetDir}/${filename}`;
    const targetPath = path.join(this.config.baseDir, 'app', relativeUrl);
    fs.writeFileSync(targetPath, buffer);

    const aid = Number(ctx.session[reqAdminIdKey] || 0);
    const now = Math.floor(Date.now() / 1000);
    const addReq = {
      aid,
      cid: Number(cid || 0),
      type: 10,
      uri: relativeUrl,
      name: path.basename(finalUrl).split('?')[0] || filename,
      ext,
      size: buffer.length,
      createTime: now,
      updateTime: now,
    };
    const albumId = await this.albumAdd(addReq);
    return {
      id: albumId,
      from: String(remoteUrl || ''),
      to: urlUtil.toAbsoluteUrl(relativeUrl),
      uri: relativeUrl,
      ext,
      size: buffer.length,
    };
  }

  /**
   * 批量转存远程图片
   */
  async transferRemoteImages(urls = [], cid = 0) {
    const candidates = Array.from(
      new Set(
        (Array.isArray(urls) ? urls : [])
          .map(url => this.normalizeRemoteUrl(url))
          .filter(url => /^https?:\/\//i.test(String(url || '').trim()))
          .filter(url => !this.isLocalMaterialUrl(url))
      )
    );

    const maps = [];
    const failed = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const remoteUrl = candidates[i];
      try {
        const item = await this.saveRemoteImageToAlbum(remoteUrl, cid);
        maps.push({
          from: item.from,
          to: item.to,
          id: item.id,
          uri: item.uri,
        });
      } catch (error) {
        failed.push({
          url: remoteUrl,
          reason: error.message || '转存失败',
        });
      }
    }

    return {
      count: maps.length,
      total: candidates.length,
      maps,
      failed,
    };
  }

  /**
   * 从正文中提取外链图片 URL
   */
  extractRemoteImageUrlsFromHtml(contentHtml = '') {
    const html = String(contentHtml || '');
    if (!html) return [];
    const tags = html.match(/<img\b[^>]*>/gi) || [];
    const urls = [];
    tags.forEach(tag => {
      const readAttr = (name) => {
        const re = new RegExp(`\\b${name}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i');
        const matched = String(tag || '').match(re);
        return String(matched?.[1] || matched?.[2] || matched?.[3] || '').replace(/&amp;/g, '&').trim();
      };
      const src = readAttr('src') || readAttr('data-src') || readAttr('data-original');
      if (!src) return;
      const normalized = this.normalizeRemoteUrl(src);
      if (!/^https?:\/\//i.test(normalized)) return;
      if (this.isLocalMaterialUrl(normalized)) return;
      urls.push(normalized);
    });
    return Array.from(new Set(urls));
  }

  /**
   * 在正文中替换图片 URL（兼容 &amp; 场景）
   */
  replaceImageUrlsInHtml(contentHtml = '', maps = []) {
    let html = String(contentHtml || '');
    const list = Array.isArray(maps) ? maps : [];
    list.forEach(item => {
      const from = String(item?.from || '').trim();
      const to = String(item?.to || '').trim();
      if (!from || !to) return;
      const fromEscaped = from.replace(/&/g, '&amp;');
      html = html.split(from).join(to);
      html = html.split(fromEscaped).join(to);
    });
    return html;
  }

  /**
   * 一键转存正文外链图片并返回替换后的正文
   */
  async transferEditorContentImages(contentHtml = '', cid = 0) {
    const html = String(contentHtml || '');
    if (!html.trim()) {
      return {
        contentHtml: html,
        count: 0,
        total: 0,
        maps: [],
        failed: [],
      };
    }
    const urls = this.extractRemoteImageUrlsFromHtml(html);
    if (!urls.length) {
      return {
        contentHtml: html,
        count: 0,
        total: 0,
        maps: [],
        failed: [],
      };
    }
    const transferResult = await this.transferRemoteImages(urls, cid);
    const nextHtml = this.replaceImageUrlsInHtml(html, transferResult.maps);
    return {
      contentHtml: nextHtml,
      count: Number(transferResult.count || 0),
      total: Number(transferResult.total || 0),
      maps: transferResult.maps || [],
      failed: transferResult.failed || [],
    };
  }
}


module.exports = AlbumService;
