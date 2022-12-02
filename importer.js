/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/*
  eslint-disable no-console,
  class-methods-use-this,
  import/no-extraneous-dependencies,
  import/no-unresolved,
*/

import {
  PageImporter,
  PageImporterResource,
  DOMUtils,
  Blocks,
} from '@adobe/helix-importer';

import fetch from 'node-fetch';
import path from 'path';

global.WebImporter = {
  Blocks,
  DOMUtils,
};

export default class Importer extends PageImporter {
  async fetch(url) {
    return fetch(url);
  }

  async process(document, url) {
    let p = new URL(url).pathname.replace(/\/$/, '');
    let name = path.basename(p);
    let dirname = path.dirname(p);

    let output = document.body;
    const { projectModuleImport } = this.params;
    if (projectModuleImport && projectModuleImport.transformDOM) {
      output = projectModuleImport.transformDOM({ document, url });
    }
    output = output || document.body;

    if (projectModuleImport && projectModuleImport.generateDocumentPath) {
      p = projectModuleImport.generateDocumentPath({ document, url });
      if (p) {
        name = path.basename(p);
        dirname = path.dirname(p);
      }
    }

    const pir = new PageImporterResource(name, dirname, output, null, {
      html: output.outerHTML,
    });
    return [pir];
  }
}
