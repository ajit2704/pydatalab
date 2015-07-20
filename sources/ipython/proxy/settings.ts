/*
 * Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

/// <reference path="../../../externs/ts/node/node.d.ts" />
/// <reference path="../../../externs/ts/node/node-uuid.d.ts" />
/// <reference path="common.d.ts" />

import fs = require('fs');
import uuid = require('node-uuid');
import path = require('path');
import util = require('util');

var SETTINGS_FILE = 'settings.%s.json';
var METADATA_FILE = 'metadata.json';

interface Metadata {
  instanceId: string;
}

/**
 * Loads the configuration settings for the application to use.
 * On first run, this generates any dynamic settings and merges them into the settings result.
 * @returns the settings object for the application to use.
 */
export function loadSettings(): common.Settings {
  var env = process.env.DATALAB_ENV || 'cloud';
  var settingsPath = path.join(__dirname, 'config', util.format(SETTINGS_FILE, env));
  var metadataPath = path.join(__dirname, 'config', METADATA_FILE);

  if (!fs.existsSync(settingsPath)) {
    console.log('Settings file %s not found.', settingsPath);
    return null;
  }

  try {
    var metadata: Metadata = null;
    if (!fs.existsSync(metadataPath)) {
      // Create an write out metadata on the first run if it doesn't exist.
      metadata = { instanceId: uuid.v4() };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), { encoding: 'utf8' });
    }
    else {
      // Load metadata from the file system. This is written out on the first run.
      metadata = <Metadata>JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    var settings = <common.Settings>JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    settings.ipythonWebServer = 'http://127.0.0.1:' + settings.ipythonPort;
    settings.ipythonSocketServer = 'ws://127.0.0.1:' + settings.ipythonPort;

    settings.projectId = process.env['CLOUD_PROJECT'] || process.env['GAE_LONG_APP_ID'] ||
                         'dev-project';
    settings.versionId = process.env['DATALAB_VERSION'] || 'dev-version';
    settings.instanceId = metadata.instanceId;

    return settings;
  }
  catch (e) {
    console.log(e);
    return null;
  }
}
