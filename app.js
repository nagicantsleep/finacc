import express from 'express';
const app = express();
import axios from 'axios';

import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { readFileSync } from 'fs';
import passport from 'passport';
import multipart from 'connect-multiparty';

import cors from 'cors';
import sprightly from 'sprightly';
import ejs from 'ejs';
import path from 'path';

import apiRouter from './routes/api.js';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import homeRouter from './routes/home.js';
import formsRouter from './routes/forms.js';
import {is_authenticated} from './libs/user.js';
import {requireTenant} from './libs/tenant.js';
import models from './models/index.js';
import { getCompanyInfo } from './libs/utils.js';

import modules from './config/module-list.js';
import env from './config/env.js';
global.env = env;

const __dirname = import.meta.dirname;
const nodeEnv = process.env.NODE_ENV || 'development';
const dbConfig = JSON.parse(readFileSync(path.join(__dirname, './config/config.json'), 'utf-8'))[nodeEnv];

// SSRのためにローカルにaxiosを向けるため
axios.defaults.baseURL = `http://localhost:${global.env.port}`;

// Trust proxy when behind a reverse proxy (production)
if (nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(logger('dev'));		//	アクセスログを見たい時には有効にする
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS: env-driven origins; production must not use wildcard
const corsOrigins = env.corsOrigins;
if (nodeEnv === 'production' && corsOrigins.length === 0) {
  console.error('[FATAL] CORS_ORIGINS must be set in production. Refusing to start with wildcard CORS.');
  process.exit(1);
}
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : ['*'],
  credentials: true
}));
app.use(multipart());

// Build session store config
const pgSessionConfig = {
  conObject: {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password
  },
  tableName: 'session',
  ttl: global.env.session_ttl
};

// connect-pg-simple: use top-level schemaName, not conObject.schema
if (dbConfig.schema) {
  pgSessionConfig.schemaName = dbConfig.schema;
}

// SSL for session store connection
if (dbConfig.dialectOptions && dbConfig.dialectOptions.ssl) {
  pgSessionConfig.conObject.ssl = dbConfig.dialectOptions.ssl;
}

app.use(session({
  secret: env.expressSecret,
  resave: false,
  saveUninitialized: false,
  name: env.appName,					    //	ここの名前は起動するnode.js毎にユニークにする
  store: new (pgSession(session))(pgSessionConfig),
  cookie: {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: global.env.session_ttl * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', './views');

app.engine('spy', sprightly);
app.set('view engine', 'spy');
//app.engine('ejs', ejs);
app.set('view engine', 'ejs');

app.use('/dist', express.static(path.join(__dirname, './dist')));
app.use('/style', express.static(path.join(__dirname, './front/stylesheets')));
app.use('/public', express.static(path.join(__dirname, './public')));

const screen = async (req, res, next) => {
  let per = modules.find((ent) => {
    return	( req.params.current === ent.name );
  })
  if	( per )	{
    const company = await getCompanyInfo(req.currentTenantId);
  	if ( !per.authority || per.authority(req.session.user, company) )	{
    	res.render('index.spy', {
      	title: per.title,
      	term: req.session.term,
    	});
  	} else {
    	res.redirect('/home');
    }
  } else {
    next();
  }
}

const voucherFile = (req, res, next) => {
  if ( req.session.user.accounting )	{
    models.VoucherFile.findOne({
      where: {
        id: req.params.id,
        tenantId: req.currentTenantId
      }
    }).then((content) => {
      res.set('Content-Type', content.mimeType);
      res.send(content.body);
    })
  } else {
    res.redirect('/home');
  }
}


app.use('/', homeRouter);

// E1.10: legacy /trial-balance → /reports/trial-balance redirect.
// Must come BEFORE the screen() fallback so the match regex sees it first.
app.get(/^\/trial-balance(\/.*)?$/, is_authenticated, requireTenant, (req, res) => {
  const sub = req.params[0] || '';
  // Preserve any query string the user passed.
  const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  res.redirect(302, `/reports/trial-balance${sub}${qs}`);
});

app.get('/voucher/file/:id', is_authenticated, requireTenant, voucherFile);
app.use('/forms', is_authenticated, requireTenant, formsRouter);
app.use('/api', apiRouter);

app.use('/:current/:command/:arg1/:arg2/:arg3', is_authenticated, requireTenant, screen);
app.use('/:current/:command/:arg1/:arg2', is_authenticated, requireTenant, screen);
app.use('/:current/:command/:arg1', is_authenticated, requireTenant, screen);
app.use('/:current/:id', is_authenticated, requireTenant, screen);
app.use('/:current', is_authenticated, requireTenant, screen);

const spaFallback = (req, res, next) => {
  // API, フォーム、ファイルへのリクエストは除外
  if (req.path.startsWith('/api/') || req.path.startsWith('/forms/') || req.path.includes('.')) {
    return next();
  }
  // それ以外のパスはSPAのエントリポイントを返す
  res.render('index.spy', {
    title: 'Hieronymus',
    term: req.session.term,
  });
}
app.use(is_authenticated, requireTenant, spaFallback);

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] 500エラー:`, {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        headers: req.headers
    });

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).send(`
        <h1>500 - Internal Server Error</h1>
        <p>${err.message}</p>
    `);
});

export default app;

