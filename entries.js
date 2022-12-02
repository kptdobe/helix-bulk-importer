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

import fetch from 'node-fetch';

async function getEntries(url) {
  const res = await fetch(url);
  if (res.ok) {
    const json = await res.json();
    const urls = json.data.filter((u) => u.URL.indexOf('/book/') !== -1).map((u) => u.URL);
    return urls;
  }
  return [];
  // return ['https://www.westjet.com/book/last-minute-flights-from-brandon-to-terrace'];
}

export default getEntries;
