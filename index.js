/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/no-unresolved, import/no-relative-packages */

import { FSHandler, Utils } from '@adobe/helix-importer';

import fs from 'fs-extra';
import fetch from 'node-fetch';
import Excel from 'exceljs';

import Importer from './importer.js';
import getEntries from './entries.js';

import projectModuleImport from '../import.js';

/* eslint-disable no-console */

const TARGET_HOST = 'https://main--westjet--hlxsites.hlx.page';
const TARGET_FOLDER = '.import/output/';

const imported = [[
  'source',
  'file',
  'redirect',
  'status',
]];

const errors = [[
  'url',
]];

const BATCH_SIZE = 2;

const createExcelFile = async (fileName, rows) => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('helix-default');
  sheet.addRows(rows);
  const dir = '.import/output/';
  await fs.ensureDir(dir);
  await workbook.xlsx.writeFile(`${dir}/${fileName}.xlsx`);
};

const createFiles = async (prefix = 'wip') => {
  await createExcelFile(`${prefix}_imported`, imported);
  await createExcelFile(`${prefix}_errors`, errors);
};

async function main() {
  // tslint:disable-next-line: no-empty
  const noop = () => {};

  const customLogger = {
    debug: noop,
    info: noop,
    log: noop,
    warn: (...args) => console.log(args),
    error: (...args) => console.error(args),
  };

  // const handler = new FSHandler(TARGET_FOLDER, customLogger);
  const handler = new FSHandler(TARGET_FOLDER, customLogger);

  const entries = await getEntries(`${TARGET_HOST}/_drafts/import/allurls.json?limit=160000`);

  const importer = new Importer({
    storageHandler: handler,
    cache: '.import/cache/',
    // skipDocxConversion: true,
    skipMDFileCreation: true,
    logger: customLogger,
    projectModuleImport,
  });

  let promises = [];
  await Utils.asyncForEach(entries, async (e, index) => {
    // eslint-disable-next-line no-async-promise-executor
    promises.push(new Promise(async (resolve) => {
      try {
        const url = e.replace('https://www.westjet.com', 'http://localhost:3000');
        const res = await fetch(url);
        if (res.ok) {
          if (res.redirected) {
            console.log(`${index} - redirect - ${res.status} ->  ${e}`);
            imported.push([
              e,
              '',
              res.url,
              res.status,
            ]);
          } else {
            const u = new URL(url);
            let path = u.pathname;
            if (path.endsWith('/')) {
              path += 'index';
            }
            const docxPath = `${path}.docx`;
            const targetPath = `${TARGET_FOLDER}${docxPath}`;
            if (!fs.existsSync(targetPath)) {
              const resources = await importer.import(url, { target: TARGET_HOST, entries });

              resources.forEach((entry) => {
                console.log(`${index} - was missing ${entry.source} -> ${entry.docx || entry.md}`);
                imported.push([
                  e,
                  entry.docx,
                ]);
              });
            } else {
              console.log(`${index} - already imported ->  ${e}`);
              imported.push([
                e,
                docxPath,
              ]);
            }
          }
        } else {
          console.log(`${index} - ${res.status} ->  ${e}`);
          imported.push([
            e,
            '',
            res.url,
            res.status,
          ]);
        }
      } catch (error) {
        errors.push([e]);
        console.error(`${index} - Could not import ${e}`, error);
      }
      resolve();
    }));

    if (promises.length === BATCH_SIZE) {
      await Promise.all(promises);
      promises = [];
      await createFiles();
    }

    // if (index % 10 === 0) {
    //   await createFiles();
    // }
  });

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  createFiles('final');

  console.log('Done');
}

main();
