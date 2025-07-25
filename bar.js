/**
 * Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @author opensource@google.com
 * @license Apache License, Version 2.0.
 */

'use strict';

// Constants.
var RELOCATE_COOLDOWN_PERIOD_MS = 400;
var X_KEYCODE = 88;

// Global variables.
var queryEl = document.getElementById('query');
var resultsEl = document.getElementById('results');
var nodeCountEl = document.getElementById('node-count');

var nodeCountText = document.createTextNode('0');
nodeCountEl.appendChild(nodeCountText);

// Used by handleMouseMove() to enforce a cooldown period on relocate.
var mostRecentRelocateTimeInMs = 0;

var evaluateQuery = function() {
  var request = {
    'type': 'evaluate',
    'query': queryEl.value
  };
  chrome.runtime.sendMessage(request, function(response) {
    // 处理响应（如果需要）
    if (chrome.runtime.lastError) {
      // 忽略错误
    }
  });
};

var handleRequest = function(request, sender, callback) {
  // Note: Setting textarea's value and text node's nodeValue is XSS-safe.
  if (request['type'] === 'update') {
    if (request['query'] !== null) {
      queryEl.value = request['query'];
    }
    if (request['results'] !== null) {
      resultsEl.value = request['results'][0];
      nodeCountText.nodeValue = request['results'][1];
    }
  }
  // 确保调用回调
  if (callback) {
    callback();
  }
  return true; // 表明我们会异步响应
};

var handleMouseMove = function(e) {
  if (e.shiftKey) {
    // Only relocate if we aren't in the cooldown period. Note, the cooldown
    // duration should take CSS transition time into consideration.
    var timeInMs = new Date().getTime();
    if (timeInMs - mostRecentRelocateTimeInMs < RELOCATE_COOLDOWN_PERIOD_MS) {
      return;
    }
    mostRecentRelocateTimeInMs = timeInMs;

    // Tell content script to move iframe to a different part of the screen.
    chrome.runtime.sendMessage({'type': 'relocateBar'}, function(response) {
      // 处理响应（如果需要）
      if (chrome.runtime.lastError) {
        // 忽略错误
      }
    });
  }
};

var handleKeyDown = function(e) {
  if (e.keyCode === X_KEYCODE && e.ctrlKey && e.shiftKey) {
    chrome.runtime.sendMessage({'type': 'hideBar'}, function(response) {
      // 处理响应（如果需要）
      if (chrome.runtime.lastError) {
        // 忽略错误
      }
    });
  }
};

queryEl.addEventListener('keyup', evaluateQuery);
queryEl.addEventListener('mouseup', evaluateQuery);

// Add mousemove listener so we can detect Shift + mousemove inside iframe.
document.addEventListener('mousemove', handleMouseMove);
// Add keydown listener so we can detect Ctrl-Shift-X and tell content script to
// steal focus and hide bar.
document.addEventListener('keydown', handleKeyDown);

chrome.runtime.onMessage.addListener(handleRequest);

var request = {
  'type': 'height',
  'height': document.documentElement.offsetHeight
};
chrome.runtime.sendMessage(request, function(response) {
  // 处理响应（如果需要）
  if (chrome.runtime.lastError) {
    // 忽略错误
  }
});
