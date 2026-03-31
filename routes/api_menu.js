import models from '../models/index.js';
const Op = models.Sequelize.Op;
import axios from 'axios';
import { JSDOM } from 'jsdom';

export default {
  get: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let id =  req.params.id;
    //console.log('/api/menu/', id);
    if	( !id )	{
      models.Menu.findAll({
        where: {
          tenantId,
          userId: req.session.user.id,
          displayOrder: {
            [Op.gt]: 0
          }
        },
        order: [
          ['displayOrder', 'ASC']
        ],
				include: [
          {
          	model: models.User,
          	as: 'user'
        	}
        ]
      }).then( async(menus) => {
        res.json({
          menus: menus
        });
      });
    } else {
      models.Menu.findOne({
        where: { tenantId, id }
      }).then((menu) => {
        res.json({
          menu: menu
        });
      });
    }
  },
  post: (req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    body.tenantId = tenantId;
    body.userId = req.session.user.id;
    models.Menu.create(body).then((menu) => {
      //console.log(menu);
      res.json({
        menu: menu
      });
    });
  },
  update: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;

    if	( body.menus )	{
			let menus = req.body.menus;
      for ( const menu of menus ) {
        if  ( menu.id ) {
          let result = await models.Menu.findOne({
            where: { tenantId, id: menu.id }
          });
          result.set(menu);
          result.tenantId = tenantId;
          await result.save();
        } else {
          await models.Menu.create({ ...menu, tenantId });
        }
      }
      models.Menu.findAll({
        where: {
          tenantId,
          userId: req.session.user.id,
          displayOrder: {
            [Op.gt]: 0
          }
        },
        order: [
          ['displayOrder', 'ASC']
        ],
				include: [
          {
          	model: models.User,
          	as: 'user'
        	}
        ]
      }).then((menus) => {
        res.json({
          menus: menus
      	})
      }).catch((e) => {
        console.log(e);
      })
    } else {
      let id = req.params.id ? req.params.id : body.id;
    	let menu = await models.Menu.findOne({
        where: { tenantId, id }
      })
    	if	( menu )	{
      	menu.set(body);
        menu.tenantId = tenantId;
      	menu.save().then(() => {
        	res.json({
          	menu: menu
        	});
      	});
    	}
    }
  },
  delete: async(req, res, next) => {
    const tenantId = req.currentTenantId;
    let body = req.body;
    let id = req.params.id ? req.params.id : body.id;

    let menu = await models.Menu.findOne({
      where: { tenantId, id }
    });
    if	( menu )	{
      menu.destroy().then(() => {
        res.json({
          code: 0});
      });
    }
  },
  getTemplates: async (req, res, next) => {
    const tenantId = req.currentTenantId;
    let templates = await models.Menu.findAll({
      where: {
        tenantId,
        userId: null,
        displayOrder: {
          [Op.gt]: 0
        }
      },
      order: [
        ['displayOrder', 'ASC']
      ],
    });
    if (templates.length === 0) {
      const accountingBody = JSON.stringify([
        { id: 'w1', x: 0, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'journal',       title: '仕訳日記帳', description: '伝票入力等の基本画面です。' } },
        { id: 'w2', x: 3, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'ledger',        title: '元帳',       description: '総勘定元帳と補助元帳が複合した画面です。' } },
        { id: 'w3', x: 6, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'trial-balance', title: '残高試算表', description: '残高試算表が確認できます。' } },
        { id: 'w4', x: 9, y: 0, w: 3, h: 23, minimize: false, component: 'MenuLink', options: { name: 'changes',       title: '推移表',     description: '科目毎の月次集計の推移をグラフ表示します。' } },
      ]);
      const homeBody = JSON.stringify([
        { id: 'w5', x: 0, y: 0, w: 6, h: 29, minimize: false, component: 'SelectTerm', options: { title: '期の選択' } },
        { id: 'w6', x: 6, y: 0, w: 4, h: 29, minimize: false, component: 'Password',   options: { title: 'パスワード変更' } },
      ]);
      templates = await models.Menu.bulkCreate([
        { tenantId, userId: null, title: '会計メニュー',  displayOrder: 1, body: accountingBody },
        { tenantId, userId: null, title: 'ホームメニュー', displayOrder: 2, body: homeBody },
      ]);
    }
    res.json({ templates });
  },
  preview: async (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
  
    try {
      const isYouTube = (url) => {
        const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
        return ytRegex.test(url);
      };
  
      const extractYouTubeId = (url) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        return match ? match[1] : null;
      };
      // Favicon取得関数
      const getFaviconUrl = (baseUrl) => {
        const links = Array.from(doc.querySelectorAll('link[rel*="icon"]'));
        for (const link of links) {
          const href = link.getAttribute('href');
          if (href) {
            try {
              return new URL(href, baseUrl).href;
            } catch {}
          }
        }
        return new URL('/favicon.ico', baseUrl).href;
      }
      const preview = {
        title: '',
        description: '',
        image: '',
        url: targetUrl,
        favicon: '',
      };
      // HTMLを取得（CORS関係ないのでサーバ側でOK）
      const response = await axios.get(targetUrl, { timeout: 8000 });
      const html = response.data;
      // DOMに変換
      const dom = new JSDOM(html);
      const doc = dom.window.document;
  
      // メタデータ取得関数
      const getMeta = (name) =>
        doc.querySelector(`meta[property="${name}"]`)?.content ||
        doc.querySelector(`meta[name="${name}"]`)?.content ||
        null;
  
      // YouTube用の特殊処理
      if (isYouTube(targetUrl)) {
        const videoId = extractYouTubeId(targetUrl);
        if (videoId) {
          preview.title = getMeta('og:title') || doc.querySelector('title')?.textContent || 'YouTube Video';
          //preview.description = `<iframe width="320" height="240" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer;" allowfullscreen></iframe>`;
          preview.description = `<iframe width="440" height="330" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer;" allowfullscreen></iframe>`;
          //preview.image = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          preview.favicon = 'https://www.youtube.com/favicon.ico';
          return res.json(preview);
        }
      } else {
        preview.title = getMeta('og:title') || doc.querySelector('title')?.textContent || '(no title)';
        preview.description = getMeta('og:description') || getMeta('description');
        preview.image = getMeta('og:image');
        preview.url = getMeta('og:url') || targetUrl;
        preview.favicon = getFaviconUrl(targetUrl);
      }
      res.json(preview);
    } catch (error) {
      console.error('URL preview fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch or parse target URL' });
    }
  }
};
