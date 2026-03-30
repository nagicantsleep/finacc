import models from '../models/index.js';
import fs from 'fs';
import Mime from 'mime';

const getFiles = async (documentId, tenantId) => {
  let files = await models.DocumentFile.findAll({
    where: {
      documentId,
      tenantId
    },
    attributes: {
      exclude: ['body']
    }
  });
  for (let i = 0; i < files.length; i += 1) {
    if (files[i].mimeType.match(/^image\//)) {
      let file = await models.DocumentFile.findOne({
        where: {
          id: files[i].id,
          tenantId
        },
        attributes: {
          include: ['body']
        }
      });
      files[i].body = file.body.toString('base64');
    } else {
      files[i].body = '';
    }
  }
  return files;
};

export default {
  get: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = req.params.id;
    try {
      if (!id) {
        let query = {
          where: {
            tenantId: req.currentTenantId
          },
          include: [{
            model: models.DocumentFile,
            as: 'files',
            where: {
              tenantId: req.currentTenantId
            },
            required: false,
            attributes: ['id', 'mimeType']
          }],
          order: [
            ['issueDate', 'DESC']
          ]
        };
        let documents = await models.Document.findAll(query);
        res.json(documents);
      } else {
        let document = await models.Document.findOne({
          where: {
            id,
            tenantId: req.currentTenantId
          }
        });
        res.json(document);
      }
    } catch (err) {
      next(err);
    }
  },
  post: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    try {
      let body = {
        ...req.body,
        tenantId: req.currentTenantId
      };
      let document = await models.Document.create(body);
      res.json(document);
    } catch (err) {
      next(err);
    }
  },
  update: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    try {
      let body = req.body;
      let id = req.params.id ? req.params.id : body.id;
      let document = await models.Document.findOne({
        where: {
          id,
          tenantId: req.currentTenantId
        }
      });
      if (document) {
        document.set({ ...body, tenantId: req.currentTenantId });
        await document.save();
        res.json(document);
      } else {
        res.status(404).json({ code: -1 });
      }
    } catch (err) {
      next(err);
    }
  },
  delete: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    try {
      let body = req.body;
      let id = req.params.id ? req.params.id : body.id;
      let document = await models.Document.findOne({
        where: {
          id,
          tenantId: req.currentTenantId
        }
      });
      if (document) {
        await document.destroy();
        res.json({ code: 0 });
      } else {
        res.status(404).json({ code: -1 });
      }
    } catch (err) {
      next(err);
    }
  },
  upload: (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let document_id = req.params.id ? parseInt(req.params.id) : null;
    let name = req.files.file.name;
    let tmp_name = req.files.file.path;
    let body = fs.readFileSync(tmp_name);
    let mime_type = Mime.getType(tmp_name);
    models.DocumentFile.create({
      name: name,
      documentId: document_id,
      tenantId: req.currentTenantId,
      mimeType: mime_type,
      body: body
    }).then((ret) => {
      ret.body = ret.body.toString('base64');
      res.json({
        code: 0,
        file: ret
      });
    }).catch((err) => {
      console.log(err);
      res.json({
        code: -1
      });
    });
  },
  files: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = req.params.id ? parseInt(req.params.id) : null;
    if (id) {
      let files = await getFiles(id, req.currentTenantId);
      res.json(files);
    }
  },
  file: (req, res, next) => {
    if (req.session.user.accounting) {
      models.DocumentFile.findOne({
        where: {
          id: req.params.id,
          tenantId: req.currentTenantId
        }
      }).then((content) => {
        if (content) {
          res.set('Content-Type', content.mimeType);
          res.send(content.body);
        } else {
          res.status(404);
          res.json({
            code: -1,
            message: 'not found'
          });
        }
      });
    } else {
      res.redirect('/home');
    }
  },
  bind: async (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let body = req.body;
    const tenantId = req.currentTenantId;
    try {
      const file = await models.DocumentFile.findOne({
        where: { id: body.id, tenantId }
      });
      if (!file) return res.status(404).json({ code: -1 });
      const document = await models.Document.findOne({
        where: { id: body.documentId, tenantId }
      });
      if (!document) return res.status(403).json({ code: -3 });
      file.documentId = body.documentId;
      await file.save();
      res.json({ code: 0 });
    } catch (e) {
      console.log('error', e);
      res.json({ code: -1 });
    }
  },
  deleteFile: (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    let id = parseInt(req.body.id);
    models.DocumentFile.findOne({
      where: {
        id,
        tenantId: req.currentTenantId
      }
    }).then((file) => {
      file.destroy().then(() => {
        res.json({
          code: 0
        });
      }).catch((e) => {
        res.json({
          code: -1
        });
      });
    }).catch((e) => {
      res.json({
        code: -1
      });
    });
  }
};
