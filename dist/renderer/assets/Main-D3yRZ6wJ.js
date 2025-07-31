import { d as defineComponent, K as h, r as ref, L as onUpdated, M as onMounted, F as Fragment, a as reactive, o as onBeforeMount, S as SHOW_INPUT_BOX, b as onBeforeUnmount, N as createBlock, e as openBlock, v as withCtx, u as unref, T, y as resolveComponent, q as createVNode, B as createTextVNode, t as toDisplayString, C as sendToMain, O as SHOW_INPUT_BOX_RESPONSE, P as config, Q as useRouter, U as updatePicBedGlobal, V as SHOW_MAIN_PAGE_QRCODE, D as watch, W as onBeforeRouteUpdate, c as createElementBlock, f as createBaseVNode, g as createCommentVNode, H as osGlobal, s as sendRPC, j as IRPCActionType, X as arrow_up_bold_default, Y as semi_select_default, Z as arrow_down_bold_default, _ as close_bold_default, a0 as upload_filled_default, a1 as pie_chart_default, a2 as picture_filled_default, h as renderList, a3 as picBedGlobal, a4 as menu_default, a5 as tools_default, a6 as share_default, a7 as link_default, a8 as info_filled_default, a9 as Transition, aa as resolveDynamicComponent, ab as KeepAlive, w as withDirectives, ac as vShow, k as getConfig, p as configPaths, ad as II18nLanguage, ae as ElMessageBox, af as saveConfig, J as ElMessage, ag as pkg, ah as nextTick, ai as pick } from "./index-BqdcQlNn.js";
import { e as emitter } from "./bus-BjW7Y6FA.js";
/*!
 * qrcode.vue v3.6.0
 * A Vue.js component to generate QRCode. Both support Vue 2 and Vue 3
 * © 2017-PRESENT @scopewu(https://github.com/scopewu)
 * MIT License.
 */
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
var qrcodegen;
(function(qrcodegen2) {
  var QrCode = (
    /** @class */
    function() {
      function QrCode2(version, errorCorrectionLevel, dataCodewords, msk) {
        this.version = version;
        this.errorCorrectionLevel = errorCorrectionLevel;
        this.modules = [];
        this.isFunction = [];
        if (version < QrCode2.MIN_VERSION || version > QrCode2.MAX_VERSION)
          throw new RangeError("Version value out of range");
        if (msk < -1 || msk > 7)
          throw new RangeError("Mask value out of range");
        this.size = version * 4 + 17;
        var row = [];
        for (var i = 0; i < this.size; i++)
          row.push(false);
        for (var i = 0; i < this.size; i++) {
          this.modules.push(row.slice());
          this.isFunction.push(row.slice());
        }
        this.drawFunctionPatterns();
        var allCodewords = this.addEccAndInterleave(dataCodewords);
        this.drawCodewords(allCodewords);
        if (msk == -1) {
          var minPenalty = 1e9;
          for (var i = 0; i < 8; i++) {
            this.applyMask(i);
            this.drawFormatBits(i);
            var penalty = this.getPenaltyScore();
            if (penalty < minPenalty) {
              msk = i;
              minPenalty = penalty;
            }
            this.applyMask(i);
          }
        }
        assert(0 <= msk && msk <= 7);
        this.mask = msk;
        this.applyMask(msk);
        this.drawFormatBits(msk);
        this.isFunction = [];
      }
      QrCode2.encodeText = function(text, ecl) {
        var segs = qrcodegen2.QrSegment.makeSegments(text);
        return QrCode2.encodeSegments(segs, ecl);
      };
      QrCode2.encodeBinary = function(data, ecl) {
        var seg = qrcodegen2.QrSegment.makeBytes(data);
        return QrCode2.encodeSegments([seg], ecl);
      };
      QrCode2.encodeSegments = function(segs, ecl, minVersion, maxVersion, mask, boostEcl) {
        if (minVersion === void 0) {
          minVersion = 1;
        }
        if (maxVersion === void 0) {
          maxVersion = 40;
        }
        if (mask === void 0) {
          mask = -1;
        }
        if (boostEcl === void 0) {
          boostEcl = true;
        }
        if (!(QrCode2.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= QrCode2.MAX_VERSION) || mask < -1 || mask > 7)
          throw new RangeError("Invalid value");
        var version;
        var dataUsedBits;
        for (version = minVersion; ; version++) {
          var dataCapacityBits_1 = QrCode2.getNumDataCodewords(version, ecl) * 8;
          var usedBits = QrSegment.getTotalBits(segs, version);
          if (usedBits <= dataCapacityBits_1) {
            dataUsedBits = usedBits;
            break;
          }
          if (version >= maxVersion)
            throw new RangeError("Data too long");
        }
        for (var _i = 0, _a = [QrCode2.Ecc.MEDIUM, QrCode2.Ecc.QUARTILE, QrCode2.Ecc.HIGH]; _i < _a.length; _i++) {
          var newEcl = _a[_i];
          if (boostEcl && dataUsedBits <= QrCode2.getNumDataCodewords(version, newEcl) * 8)
            ecl = newEcl;
        }
        var bb = [];
        for (var _b = 0, segs_1 = segs; _b < segs_1.length; _b++) {
          var seg = segs_1[_b];
          appendBits(seg.mode.modeBits, 4, bb);
          appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
          for (var _c = 0, _d = seg.getData(); _c < _d.length; _c++) {
            var b = _d[_c];
            bb.push(b);
          }
        }
        assert(bb.length == dataUsedBits);
        var dataCapacityBits = QrCode2.getNumDataCodewords(version, ecl) * 8;
        assert(bb.length <= dataCapacityBits);
        appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
        appendBits(0, (8 - bb.length % 8) % 8, bb);
        assert(bb.length % 8 == 0);
        for (var padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
          appendBits(padByte, 8, bb);
        var dataCodewords = [];
        while (dataCodewords.length * 8 < bb.length)
          dataCodewords.push(0);
        bb.forEach(function(b2, i) {
          return dataCodewords[i >>> 3] |= b2 << 7 - (i & 7);
        });
        return new QrCode2(version, ecl, dataCodewords, mask);
      };
      QrCode2.prototype.getModule = function(x, y) {
        return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
      };
      QrCode2.prototype.getModules = function() {
        return this.modules;
      };
      QrCode2.prototype.drawFunctionPatterns = function() {
        for (var i = 0; i < this.size; i++) {
          this.setFunctionModule(6, i, i % 2 == 0);
          this.setFunctionModule(i, 6, i % 2 == 0);
        }
        this.drawFinderPattern(3, 3);
        this.drawFinderPattern(this.size - 4, 3);
        this.drawFinderPattern(3, this.size - 4);
        var alignPatPos = this.getAlignmentPatternPositions();
        var numAlign = alignPatPos.length;
        for (var i = 0; i < numAlign; i++) {
          for (var j = 0; j < numAlign; j++) {
            if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0))
              this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
          }
        }
        this.drawFormatBits(0);
        this.drawVersion();
      };
      QrCode2.prototype.drawFormatBits = function(mask) {
        var data = this.errorCorrectionLevel.formatBits << 3 | mask;
        var rem = data;
        for (var i = 0; i < 10; i++)
          rem = rem << 1 ^ (rem >>> 9) * 1335;
        var bits = (data << 10 | rem) ^ 21522;
        assert(bits >>> 15 == 0);
        for (var i = 0; i <= 5; i++)
          this.setFunctionModule(8, i, getBit(bits, i));
        this.setFunctionModule(8, 7, getBit(bits, 6));
        this.setFunctionModule(8, 8, getBit(bits, 7));
        this.setFunctionModule(7, 8, getBit(bits, 8));
        for (var i = 9; i < 15; i++)
          this.setFunctionModule(14 - i, 8, getBit(bits, i));
        for (var i = 0; i < 8; i++)
          this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
        for (var i = 8; i < 15; i++)
          this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
        this.setFunctionModule(8, this.size - 8, true);
      };
      QrCode2.prototype.drawVersion = function() {
        if (this.version < 7)
          return;
        var rem = this.version;
        for (var i = 0; i < 12; i++)
          rem = rem << 1 ^ (rem >>> 11) * 7973;
        var bits = this.version << 12 | rem;
        assert(bits >>> 18 == 0);
        for (var i = 0; i < 18; i++) {
          var color = getBit(bits, i);
          var a = this.size - 11 + i % 3;
          var b = Math.floor(i / 3);
          this.setFunctionModule(a, b, color);
          this.setFunctionModule(b, a, color);
        }
      };
      QrCode2.prototype.drawFinderPattern = function(x, y) {
        for (var dy = -4; dy <= 4; dy++) {
          for (var dx = -4; dx <= 4; dx++) {
            var dist = Math.max(Math.abs(dx), Math.abs(dy));
            var xx = x + dx;
            var yy = y + dy;
            if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
              this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
          }
        }
      };
      QrCode2.prototype.drawAlignmentPattern = function(x, y) {
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++)
            this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
        }
      };
      QrCode2.prototype.setFunctionModule = function(x, y, isDark) {
        this.modules[y][x] = isDark;
        this.isFunction[y][x] = true;
      };
      QrCode2.prototype.addEccAndInterleave = function(data) {
        var ver = this.version;
        var ecl = this.errorCorrectionLevel;
        if (data.length != QrCode2.getNumDataCodewords(ver, ecl))
          throw new RangeError("Invalid argument");
        var numBlocks = QrCode2.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
        var blockEccLen = QrCode2.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
        var rawCodewords = Math.floor(QrCode2.getNumRawDataModules(ver) / 8);
        var numShortBlocks = numBlocks - rawCodewords % numBlocks;
        var shortBlockLen = Math.floor(rawCodewords / numBlocks);
        var blocks = [];
        var rsDiv = QrCode2.reedSolomonComputeDivisor(blockEccLen);
        for (var i = 0, k = 0; i < numBlocks; i++) {
          var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
          k += dat.length;
          var ecc = QrCode2.reedSolomonComputeRemainder(dat, rsDiv);
          if (i < numShortBlocks)
            dat.push(0);
          blocks.push(dat.concat(ecc));
        }
        var result = [];
        var _loop_1 = function(i2) {
          blocks.forEach(function(block, j) {
            if (i2 != shortBlockLen - blockEccLen || j >= numShortBlocks)
              result.push(block[i2]);
          });
        };
        for (var i = 0; i < blocks[0].length; i++) {
          _loop_1(i);
        }
        assert(result.length == rawCodewords);
        return result;
      };
      QrCode2.prototype.drawCodewords = function(data) {
        if (data.length != Math.floor(QrCode2.getNumRawDataModules(this.version) / 8))
          throw new RangeError("Invalid argument");
        var i = 0;
        for (var right = this.size - 1; right >= 1; right -= 2) {
          if (right == 6)
            right = 5;
          for (var vert = 0; vert < this.size; vert++) {
            for (var j = 0; j < 2; j++) {
              var x = right - j;
              var upward = (right + 1 & 2) == 0;
              var y = upward ? this.size - 1 - vert : vert;
              if (!this.isFunction[y][x] && i < data.length * 8) {
                this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
                i++;
              }
            }
          }
        }
        assert(i == data.length * 8);
      };
      QrCode2.prototype.applyMask = function(mask) {
        if (mask < 0 || mask > 7)
          throw new RangeError("Mask value out of range");
        for (var y = 0; y < this.size; y++) {
          for (var x = 0; x < this.size; x++) {
            var invert = void 0;
            switch (mask) {
              case 0:
                invert = (x + y) % 2 == 0;
                break;
              case 1:
                invert = y % 2 == 0;
                break;
              case 2:
                invert = x % 3 == 0;
                break;
              case 3:
                invert = (x + y) % 3 == 0;
                break;
              case 4:
                invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;
                break;
              case 5:
                invert = x * y % 2 + x * y % 3 == 0;
                break;
              case 6:
                invert = (x * y % 2 + x * y % 3) % 2 == 0;
                break;
              case 7:
                invert = ((x + y) % 2 + x * y % 3) % 2 == 0;
                break;
              default:
                throw new Error("Unreachable");
            }
            if (!this.isFunction[y][x] && invert)
              this.modules[y][x] = !this.modules[y][x];
          }
        }
      };
      QrCode2.prototype.getPenaltyScore = function() {
        var result = 0;
        for (var y = 0; y < this.size; y++) {
          var runColor = false;
          var runX = 0;
          var runHistory = [0, 0, 0, 0, 0, 0, 0];
          for (var x = 0; x < this.size; x++) {
            if (this.modules[y][x] == runColor) {
              runX++;
              if (runX == 5)
                result += QrCode2.PENALTY_N1;
              else if (runX > 5)
                result++;
            } else {
              this.finderPenaltyAddHistory(runX, runHistory);
              if (!runColor)
                result += this.finderPenaltyCountPatterns(runHistory) * QrCode2.PENALTY_N3;
              runColor = this.modules[y][x];
              runX = 1;
            }
          }
          result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode2.PENALTY_N3;
        }
        for (var x = 0; x < this.size; x++) {
          var runColor = false;
          var runY = 0;
          var runHistory = [0, 0, 0, 0, 0, 0, 0];
          for (var y = 0; y < this.size; y++) {
            if (this.modules[y][x] == runColor) {
              runY++;
              if (runY == 5)
                result += QrCode2.PENALTY_N1;
              else if (runY > 5)
                result++;
            } else {
              this.finderPenaltyAddHistory(runY, runHistory);
              if (!runColor)
                result += this.finderPenaltyCountPatterns(runHistory) * QrCode2.PENALTY_N3;
              runColor = this.modules[y][x];
              runY = 1;
            }
          }
          result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode2.PENALTY_N3;
        }
        for (var y = 0; y < this.size - 1; y++) {
          for (var x = 0; x < this.size - 1; x++) {
            var color = this.modules[y][x];
            if (color == this.modules[y][x + 1] && color == this.modules[y + 1][x] && color == this.modules[y + 1][x + 1])
              result += QrCode2.PENALTY_N2;
          }
        }
        var dark = 0;
        for (var _i = 0, _a = this.modules; _i < _a.length; _i++) {
          var row = _a[_i];
          dark = row.reduce(function(sum, color2) {
            return sum + (color2 ? 1 : 0);
          }, dark);
        }
        var total = this.size * this.size;
        var k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
        assert(0 <= k && k <= 9);
        result += k * QrCode2.PENALTY_N4;
        assert(0 <= result && result <= 2568888);
        return result;
      };
      QrCode2.prototype.getAlignmentPatternPositions = function() {
        if (this.version == 1)
          return [];
        else {
          var numAlign = Math.floor(this.version / 7) + 2;
          var step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
          var result = [6];
          for (var pos = this.size - 7; result.length < numAlign; pos -= step)
            result.splice(1, 0, pos);
          return result;
        }
      };
      QrCode2.getNumRawDataModules = function(ver) {
        if (ver < QrCode2.MIN_VERSION || ver > QrCode2.MAX_VERSION)
          throw new RangeError("Version number out of range");
        var result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
          var numAlign = Math.floor(ver / 7) + 2;
          result -= (25 * numAlign - 10) * numAlign - 55;
          if (ver >= 7)
            result -= 36;
        }
        assert(208 <= result && result <= 29648);
        return result;
      };
      QrCode2.getNumDataCodewords = function(ver, ecl) {
        return Math.floor(QrCode2.getNumRawDataModules(ver) / 8) - QrCode2.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * QrCode2.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
      };
      QrCode2.reedSolomonComputeDivisor = function(degree) {
        if (degree < 1 || degree > 255)
          throw new RangeError("Degree out of range");
        var result = [];
        for (var i = 0; i < degree - 1; i++)
          result.push(0);
        result.push(1);
        var root = 1;
        for (var i = 0; i < degree; i++) {
          for (var j = 0; j < result.length; j++) {
            result[j] = QrCode2.reedSolomonMultiply(result[j], root);
            if (j + 1 < result.length)
              result[j] ^= result[j + 1];
          }
          root = QrCode2.reedSolomonMultiply(root, 2);
        }
        return result;
      };
      QrCode2.reedSolomonComputeRemainder = function(data, divisor) {
        var result = divisor.map(function(_) {
          return 0;
        });
        var _loop_2 = function(b2) {
          var factor = b2 ^ result.shift();
          result.push(0);
          divisor.forEach(function(coef, i) {
            return result[i] ^= QrCode2.reedSolomonMultiply(coef, factor);
          });
        };
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
          var b = data_1[_i];
          _loop_2(b);
        }
        return result;
      };
      QrCode2.reedSolomonMultiply = function(x, y) {
        if (x >>> 8 != 0 || y >>> 8 != 0)
          throw new RangeError("Byte out of range");
        var z = 0;
        for (var i = 7; i >= 0; i--) {
          z = z << 1 ^ (z >>> 7) * 285;
          z ^= (y >>> i & 1) * x;
        }
        assert(z >>> 8 == 0);
        return z;
      };
      QrCode2.prototype.finderPenaltyCountPatterns = function(runHistory) {
        var n = runHistory[1];
        assert(n <= this.size * 3);
        var core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
        return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
      };
      QrCode2.prototype.finderPenaltyTerminateAndCount = function(currentRunColor, currentRunLength, runHistory) {
        if (currentRunColor) {
          this.finderPenaltyAddHistory(currentRunLength, runHistory);
          currentRunLength = 0;
        }
        currentRunLength += this.size;
        this.finderPenaltyAddHistory(currentRunLength, runHistory);
        return this.finderPenaltyCountPatterns(runHistory);
      };
      QrCode2.prototype.finderPenaltyAddHistory = function(currentRunLength, runHistory) {
        if (runHistory[0] == 0)
          currentRunLength += this.size;
        runHistory.pop();
        runHistory.unshift(currentRunLength);
      };
      QrCode2.MIN_VERSION = 1;
      QrCode2.MAX_VERSION = 40;
      QrCode2.PENALTY_N1 = 3;
      QrCode2.PENALTY_N2 = 3;
      QrCode2.PENALTY_N3 = 40;
      QrCode2.PENALTY_N4 = 10;
      QrCode2.ECC_CODEWORDS_PER_BLOCK = [
        // Version: (note that index 0 is for padding, and is set to an illegal value)
        //0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
        [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        // Low
        [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
        // Medium
        [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        // Quartile
        [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
        // High
      ];
      QrCode2.NUM_ERROR_CORRECTION_BLOCKS = [
        // Version: (note that index 0 is for padding, and is set to an illegal value)
        //0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
        [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
        // Low
        [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
        // Medium
        [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
        // Quartile
        [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
        // High
      ];
      return QrCode2;
    }()
  );
  qrcodegen2.QrCode = QrCode;
  function appendBits(val, len, bb) {
    if (len < 0 || len > 31 || val >>> len != 0)
      throw new RangeError("Value out of range");
    for (var i = len - 1; i >= 0; i--)
      bb.push(val >>> i & 1);
  }
  function getBit(x, i) {
    return (x >>> i & 1) != 0;
  }
  function assert(cond) {
    if (!cond)
      throw new Error("Assertion error");
  }
  var QrSegment = (
    /** @class */
    function() {
      function QrSegment2(mode, numChars, bitData) {
        this.mode = mode;
        this.numChars = numChars;
        this.bitData = bitData;
        if (numChars < 0)
          throw new RangeError("Invalid argument");
        this.bitData = bitData.slice();
      }
      QrSegment2.makeBytes = function(data) {
        var bb = [];
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
          var b = data_2[_i];
          appendBits(b, 8, bb);
        }
        return new QrSegment2(QrSegment2.Mode.BYTE, data.length, bb);
      };
      QrSegment2.makeNumeric = function(digits) {
        if (!QrSegment2.isNumeric(digits))
          throw new RangeError("String contains non-numeric characters");
        var bb = [];
        for (var i = 0; i < digits.length; ) {
          var n = Math.min(digits.length - i, 3);
          appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
          i += n;
        }
        return new QrSegment2(QrSegment2.Mode.NUMERIC, digits.length, bb);
      };
      QrSegment2.makeAlphanumeric = function(text) {
        if (!QrSegment2.isAlphanumeric(text))
          throw new RangeError("String contains unencodable characters in alphanumeric mode");
        var bb = [];
        var i;
        for (i = 0; i + 2 <= text.length; i += 2) {
          var temp = QrSegment2.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
          temp += QrSegment2.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
          appendBits(temp, 11, bb);
        }
        if (i < text.length)
          appendBits(QrSegment2.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
        return new QrSegment2(QrSegment2.Mode.ALPHANUMERIC, text.length, bb);
      };
      QrSegment2.makeSegments = function(text) {
        if (text == "")
          return [];
        else if (QrSegment2.isNumeric(text))
          return [QrSegment2.makeNumeric(text)];
        else if (QrSegment2.isAlphanumeric(text))
          return [QrSegment2.makeAlphanumeric(text)];
        else
          return [QrSegment2.makeBytes(QrSegment2.toUtf8ByteArray(text))];
      };
      QrSegment2.makeEci = function(assignVal) {
        var bb = [];
        if (assignVal < 0)
          throw new RangeError("ECI assignment value out of range");
        else if (assignVal < 1 << 7)
          appendBits(assignVal, 8, bb);
        else if (assignVal < 1 << 14) {
          appendBits(2, 2, bb);
          appendBits(assignVal, 14, bb);
        } else if (assignVal < 1e6) {
          appendBits(6, 3, bb);
          appendBits(assignVal, 21, bb);
        } else
          throw new RangeError("ECI assignment value out of range");
        return new QrSegment2(QrSegment2.Mode.ECI, 0, bb);
      };
      QrSegment2.isNumeric = function(text) {
        return QrSegment2.NUMERIC_REGEX.test(text);
      };
      QrSegment2.isAlphanumeric = function(text) {
        return QrSegment2.ALPHANUMERIC_REGEX.test(text);
      };
      QrSegment2.prototype.getData = function() {
        return this.bitData.slice();
      };
      QrSegment2.getTotalBits = function(segs, version) {
        var result = 0;
        for (var _i = 0, segs_2 = segs; _i < segs_2.length; _i++) {
          var seg = segs_2[_i];
          var ccbits = seg.mode.numCharCountBits(version);
          if (seg.numChars >= 1 << ccbits)
            return Infinity;
          result += 4 + ccbits + seg.bitData.length;
        }
        return result;
      };
      QrSegment2.toUtf8ByteArray = function(str) {
        str = encodeURI(str);
        var result = [];
        for (var i = 0; i < str.length; i++) {
          if (str.charAt(i) != "%")
            result.push(str.charCodeAt(i));
          else {
            result.push(parseInt(str.substring(i + 1, i + 3), 16));
            i += 2;
          }
        }
        return result;
      };
      QrSegment2.NUMERIC_REGEX = /^[0-9]*$/;
      QrSegment2.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
      QrSegment2.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
      return QrSegment2;
    }()
  );
  qrcodegen2.QrSegment = QrSegment;
})(qrcodegen || (qrcodegen = {}));
(function(qrcodegen2) {
  (function(QrCode) {
    var Ecc = (
      /** @class */
      function() {
        function Ecc2(ordinal, formatBits) {
          this.ordinal = ordinal;
          this.formatBits = formatBits;
        }
        Ecc2.LOW = new Ecc2(0, 1);
        Ecc2.MEDIUM = new Ecc2(1, 0);
        Ecc2.QUARTILE = new Ecc2(2, 3);
        Ecc2.HIGH = new Ecc2(3, 2);
        return Ecc2;
      }()
    );
    QrCode.Ecc = Ecc;
  })(qrcodegen2.QrCode || (qrcodegen2.QrCode = {}));
})(qrcodegen || (qrcodegen = {}));
(function(qrcodegen2) {
  (function(QrSegment) {
    var Mode = (
      /** @class */
      function() {
        function Mode2(modeBits, numBitsCharCount) {
          this.modeBits = modeBits;
          this.numBitsCharCount = numBitsCharCount;
        }
        Mode2.prototype.numCharCountBits = function(ver) {
          return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
        };
        Mode2.NUMERIC = new Mode2(1, [10, 12, 14]);
        Mode2.ALPHANUMERIC = new Mode2(2, [9, 11, 13]);
        Mode2.BYTE = new Mode2(4, [8, 16, 16]);
        Mode2.KANJI = new Mode2(8, [8, 10, 12]);
        Mode2.ECI = new Mode2(7, [0, 0, 0]);
        return Mode2;
      }()
    );
    QrSegment.Mode = Mode;
  })(qrcodegen2.QrSegment || (qrcodegen2.QrSegment = {}));
})(qrcodegen || (qrcodegen = {}));
var QR = qrcodegen;
var defaultErrorCorrectLevel = "L";
var ErrorCorrectLevelMap = {
  L: QR.QrCode.Ecc.LOW,
  M: QR.QrCode.Ecc.MEDIUM,
  Q: QR.QrCode.Ecc.QUARTILE,
  H: QR.QrCode.Ecc.HIGH
};
var SUPPORTS_PATH2D = function() {
  try {
    new Path2D().addPath(new Path2D());
  } catch (e) {
    return false;
  }
  return true;
}();
function validErrorCorrectLevel(level) {
  return level in ErrorCorrectLevelMap;
}
function generatePath(modules, margin) {
  if (margin === void 0) {
    margin = 0;
  }
  var ops = [];
  modules.forEach(function(row, y) {
    var start = null;
    row.forEach(function(cell, x) {
      if (!cell && start !== null) {
        ops.push("M".concat(start + margin, " ").concat(y + margin, "h").concat(x - start, "v1H").concat(start + margin, "z"));
        start = null;
        return;
      }
      if (x === row.length - 1) {
        if (!cell) {
          return;
        }
        if (start === null) {
          ops.push("M".concat(x + margin, ",").concat(y + margin, " h1v1H").concat(x + margin, "z"));
        } else {
          ops.push("M".concat(start + margin, ",").concat(y + margin, " h").concat(x + 1 - start, "v1H").concat(start + margin, "z"));
        }
        return;
      }
      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join("");
}
function getImageSettings(cells, size, margin, imageSettings) {
  var width = imageSettings.width, height = imageSettings.height, imageX = imageSettings.x, imageY = imageSettings.y;
  var numCells = cells.length + margin * 2;
  var defaultSize = Math.floor(size * 0.1);
  var scale = numCells / size;
  var w = (width || defaultSize) * scale;
  var h2 = (height || defaultSize) * scale;
  var x = imageX == null ? cells.length / 2 - w / 2 : imageX * scale;
  var y = imageY == null ? cells.length / 2 - h2 / 2 : imageY * scale;
  var excavation = null;
  if (imageSettings.excavate) {
    var floorX = Math.floor(x);
    var floorY = Math.floor(y);
    var ceilW = Math.ceil(w + x - floorX);
    var ceilH = Math.ceil(h2 + y - floorY);
    excavation = { x: floorX, y: floorY, w: ceilW, h: ceilH };
  }
  return { x, y, h: h2, w, excavation };
}
function excavateModules(modules, excavation) {
  return modules.slice().map(function(row, y) {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row;
    }
    return row.map(function(cell, x) {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell;
      }
      return false;
    });
  });
}
var QRCodeProps = {
  value: {
    type: String,
    required: true,
    default: ""
  },
  size: {
    type: Number,
    default: 100
  },
  level: {
    type: String,
    default: defaultErrorCorrectLevel,
    validator: function(l) {
      return validErrorCorrectLevel(l);
    }
  },
  background: {
    type: String,
    default: "#fff"
  },
  foreground: {
    type: String,
    default: "#000"
  },
  margin: {
    type: Number,
    required: false,
    default: 0
  },
  imageSettings: {
    type: Object,
    required: false,
    default: function() {
      return {};
    }
  },
  gradient: {
    type: Boolean,
    required: false,
    default: false
  },
  gradientType: {
    type: String,
    required: false,
    default: "linear",
    validator: function(t) {
      return ["linear", "radial"].indexOf(t) > -1;
    }
  },
  gradientStartColor: {
    type: String,
    required: false,
    default: "#000"
  },
  gradientEndColor: {
    type: String,
    required: false,
    default: "#fff"
  }
};
var QRCodeVueProps = __assign(__assign({}, QRCodeProps), { renderAs: {
  type: String,
  required: false,
  default: "canvas",
  validator: function(as) {
    return ["canvas", "svg"].indexOf(as) > -1;
  }
} });
var QrcodeSvg = defineComponent({
  name: "QRCodeSvg",
  props: QRCodeProps,
  setup: function(props) {
    var numCells = ref(0);
    var fgPath = ref("");
    var imageProps;
    var generate = function() {
      var value = props.value, _level = props.level, _margin = props.margin;
      var margin = _margin >>> 0;
      var level = validErrorCorrectLevel(_level) ? _level : defaultErrorCorrectLevel;
      var cells = QR.QrCode.encodeText(value, ErrorCorrectLevelMap[level]).getModules();
      numCells.value = cells.length + margin * 2;
      if (props.imageSettings.src) {
        var imageSettings = getImageSettings(cells, props.size, margin, props.imageSettings);
        imageProps = {
          x: imageSettings.x + margin,
          y: imageSettings.y + margin,
          width: imageSettings.w,
          height: imageSettings.h
        };
        if (imageSettings.excavation) {
          cells = excavateModules(cells, imageSettings.excavation);
        }
      }
      fgPath.value = generatePath(cells, margin);
    };
    var renderGradient = function() {
      if (!props.gradient)
        return null;
      var gradientProps = props.gradientType === "linear" ? {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%"
      } : {
        cx: "50%",
        cy: "50%",
        r: "50%",
        fx: "50%",
        fy: "50%"
      };
      return h(props.gradientType === "linear" ? "linearGradient" : "radialGradient", __assign({ id: "qr-gradient" }, gradientProps), [
        h("stop", {
          offset: "0%",
          style: { stopColor: props.gradientStartColor }
        }),
        h("stop", {
          offset: "100%",
          style: { stopColor: props.gradientEndColor }
        })
      ]);
    };
    generate();
    onUpdated(generate);
    return function() {
      return h("svg", {
        width: props.size,
        height: props.size,
        "shape-rendering": "crispEdges",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 ".concat(numCells.value, " ").concat(numCells.value)
      }, [
        h("defs", {}, [renderGradient()]),
        h("rect", {
          width: "100%",
          height: "100%",
          fill: props.background
        }),
        h("path", {
          fill: props.gradient ? "url(#qr-gradient)" : props.foreground,
          d: fgPath.value
        }),
        props.imageSettings.src && h("image", __assign({ href: props.imageSettings.src }, imageProps))
      ]);
    };
  }
});
var QrcodeCanvas = defineComponent({
  name: "QRCodeCanvas",
  props: QRCodeProps,
  setup: function(props, ctx) {
    var canvasEl = ref(null);
    var imageRef = ref(null);
    var generate = function() {
      var value = props.value, _level = props.level, size = props.size, _margin = props.margin, background = props.background, foreground = props.foreground, gradient = props.gradient, gradientType = props.gradientType, gradientStartColor = props.gradientStartColor, gradientEndColor = props.gradientEndColor;
      var margin = _margin >>> 0;
      var level = validErrorCorrectLevel(_level) ? _level : defaultErrorCorrectLevel;
      var canvas = canvasEl.value;
      if (!canvas) {
        return;
      }
      var ctx2 = canvas.getContext("2d");
      if (!ctx2) {
        return;
      }
      var cells = QR.QrCode.encodeText(value, ErrorCorrectLevelMap[level]).getModules();
      var numCells = cells.length + margin * 2;
      var image = imageRef.value;
      var imageProps = { x: 0, y: 0, width: 0, height: 0 };
      var showImage = props.imageSettings.src && image != null && image.naturalWidth !== 0 && image.naturalHeight !== 0;
      if (showImage) {
        var imageSettings = getImageSettings(cells, props.size, margin, props.imageSettings);
        imageProps = {
          x: imageSettings.x + margin,
          y: imageSettings.y + margin,
          width: imageSettings.w,
          height: imageSettings.h
        };
        if (imageSettings.excavation) {
          cells = excavateModules(cells, imageSettings.excavation);
        }
      }
      var devicePixelRatio = window.devicePixelRatio || 1;
      var scale = size / numCells * devicePixelRatio;
      canvas.height = canvas.width = size * devicePixelRatio;
      ctx2.scale(scale, scale);
      ctx2.fillStyle = background;
      ctx2.fillRect(0, 0, numCells, numCells);
      if (gradient) {
        var grad = void 0;
        if (gradientType === "linear") {
          grad = ctx2.createLinearGradient(0, 0, numCells, numCells);
        } else {
          grad = ctx2.createRadialGradient(numCells / 2, numCells / 2, 0, numCells / 2, numCells / 2, numCells / 2);
        }
        grad.addColorStop(0, gradientStartColor);
        grad.addColorStop(1, gradientEndColor);
        ctx2.fillStyle = grad;
      } else {
        ctx2.fillStyle = foreground;
      }
      if (SUPPORTS_PATH2D) {
        ctx2.fill(new Path2D(generatePath(cells, margin)));
      } else {
        cells.forEach(function(row, rdx) {
          row.forEach(function(cell, cdx) {
            if (cell) {
              ctx2.fillRect(cdx + margin, rdx + margin, 1, 1);
            }
          });
        });
      }
      if (showImage) {
        ctx2.drawImage(image, imageProps.x, imageProps.y, imageProps.width, imageProps.height);
      }
    };
    onMounted(generate);
    onUpdated(generate);
    var style = ctx.attrs.style;
    return function() {
      return h(Fragment, [
        h("canvas", __assign(__assign({}, ctx.attrs), { ref: canvasEl, style: __assign(__assign({}, style), { width: "".concat(props.size, "px"), height: "".concat(props.size, "px") }) })),
        props.imageSettings.src && h("img", {
          ref: imageRef,
          src: props.imageSettings.src,
          style: { display: "none" },
          onLoad: generate
        })
      ]);
    };
  }
});
var QrcodeVue = defineComponent({
  name: "Qrcode",
  render: function() {
    var _a = this.$props, renderAs = _a.renderAs, value = _a.value, size = _a.size, margin = _a.margin, level = _a.level, background = _a.background, foreground = _a.foreground, imageSettings = _a.imageSettings, gradient = _a.gradient, gradientType = _a.gradientType, gradientStartColor = _a.gradientStartColor, gradientEndColor = _a.gradientEndColor;
    return h(renderAs === "svg" ? QrcodeSvg : QrcodeCanvas, {
      value,
      size,
      margin,
      level,
      background,
      foreground,
      imageSettings,
      gradient,
      gradientType,
      gradientStartColor,
      gradientEndColor
    });
  },
  props: QRCodeVueProps
});
const __default__$1 = {
  name: "InputBoxDialog"
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  ...__default__$1,
  setup(__props) {
    const inputBoxValue = ref("");
    const showInputBoxVisible = ref(false);
    const inputBoxOptions = reactive({
      title: "",
      placeholder: ""
    });
    onBeforeMount(() => {
      window.electron.electronAPI.ipcRenderer.on(SHOW_INPUT_BOX, ipcEventHandler);
      emitter.on(SHOW_INPUT_BOX, initInputBoxValue);
    });
    function ipcEventHandler(_, options) {
      initInputBoxValue(options);
    }
    function initInputBoxValue(options) {
      inputBoxValue.value = options.value || "";
      inputBoxOptions.title = options.title || "";
      inputBoxOptions.placeholder = options.placeholder || "";
      showInputBoxVisible.value = true;
    }
    function handleInputBoxCancel() {
      showInputBoxVisible.value = false;
      sendToMain(SHOW_INPUT_BOX, "");
      emitter.emit(SHOW_INPUT_BOX_RESPONSE, "");
    }
    function handleInputBoxConfirm() {
      showInputBoxVisible.value = false;
      sendToMain(SHOW_INPUT_BOX, inputBoxValue.value);
      emitter.emit(SHOW_INPUT_BOX_RESPONSE, inputBoxValue.value);
    }
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeListener(SHOW_INPUT_BOX, ipcEventHandler);
      emitter.off(SHOW_INPUT_BOX);
    });
    return (_ctx, _cache) => {
      const _component_el_input = resolveComponent("el-input");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_dialog = resolveComponent("el-dialog");
      return openBlock(), createBlock(_component_el_dialog, {
        modelValue: showInputBoxVisible.value,
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => showInputBoxVisible.value = $event),
        title: inputBoxOptions.title || unref(T)("INPUT"),
        "modal-append-to-body": false,
        "append-to-body": ""
      }, {
        footer: withCtx(() => [
          createVNode(_component_el_button, {
            round: "",
            onClick: handleInputBoxCancel
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(unref(T)("CANCEL")), 1)
            ]),
            _: 1
          }),
          createVNode(_component_el_button, {
            type: "primary",
            round: "",
            onClick: handleInputBoxConfirm
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(unref(T)("CONFIRM")), 1)
            ]),
            _: 1
          })
        ]),
        default: withCtx(() => [
          createVNode(_component_el_input, {
            modelValue: inputBoxValue.value,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => inputBoxValue.value = $event),
            placeholder: inputBoxOptions.placeholder
          }, null, 8, ["modelValue", "placeholder"])
        ]),
        _: 1
      }, 8, ["modelValue", "title"]);
    };
  }
});
const _hoisted_1 = { id: "main-page" };
const _hoisted_2 = { class: "fake-title-bar" };
const _hoisted_3 = { class: "fake-title-bar__title" };
const _hoisted_4 = {
  key: 0,
  class: "handle-bar"
};
const _hoisted_5 = { class: "qrcode-container" };
const __default__ = {
  name: "MainPage"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  setup(__props) {
    const version = ref(pkg.version);
    const routerConfig = reactive(config);
    const defaultActive = ref(routerConfig.UPLOAD_PAGE);
    const $router = useRouter();
    const qrcodeVisible = ref(false);
    const picBedConfigString = ref("");
    const choosedPicBedForQRCode = ref([]);
    const isAlwaysOnTop = ref(false);
    const keepAlivePages = $router.getRoutes().filter((item) => item.meta.keepAlive).map((item) => item.name);
    const isShowprogress = ref(false);
    const progress = ref(0);
    onBeforeMount(() => {
      updatePicBedGlobal();
      window.electron.electronAPI.ipcRenderer.on(SHOW_MAIN_PAGE_QRCODE, () => {
        qrcodeVisible.value = true;
      });
      window.electron.electronAPI.ipcRenderer.on("updateProgress", (_event, data) => {
        isShowprogress.value = data.progress !== 100 && data.progress !== 0;
        progress.value = data.progress;
      });
    });
    watch(
      () => choosedPicBedForQRCode,
      (val) => {
        if (val.value.length > 0) {
          nextTick(async () => {
            const picBedConfig = await getConfig("picBed");
            const config2 = pick(picBedConfig, ...choosedPicBedForQRCode.value);
            picBedConfigString.value = JSON.stringify(config2);
          });
        }
      },
      { deep: true }
    );
    const handleSelect = async (index) => {
      defaultActive.value = index;
      if (index === routerConfig.DocumentPage) {
        const manualPageOpenSetting = await getConfig(configPaths.settings.manualPageOpen);
        const lang = await getConfig(configPaths.settings.language) || II18nLanguage.ZH_CN;
        const openManual = () => sendRPC(IRPCActionType.OPEN_MANUAL_WINDOW);
        const openExternal = () => sendRPC(
          IRPCActionType.OPEN_URL,
          lang === II18nLanguage.ZH_CN ? "https://piclist.cn/app.html" : "https://piclist.cn/en/app.html"
        );
        if (!manualPageOpenSetting) {
          ElMessageBox.confirm(T("MANUAL_PAGE_OPEN_TIP"), T("MANUAL_PAGE_OPEN_TIP_TITLE"), {
            confirmButtonText: T("MANUAL_PAGE_OPEN_BY_BROWSER"),
            cancelButtonText: T("MANUAL_PAGE_OPEN_BY_BUILD_IN"),
            type: "info",
            center: true
          }).then(() => {
            saveConfig(configPaths.settings.manualPageOpen, "browser");
            openExternal();
          }).catch(() => {
            saveConfig(configPaths.settings.manualPageOpen, "window");
            openManual();
          });
        } else {
          manualPageOpenSetting === "window" ? openManual() : openExternal();
        }
        return;
      }
      const type = index.match(routerConfig.UPLOADER_CONFIG_PAGE);
      if (type === null) {
        $router.push({
          name: index
        });
      } else {
        const type2 = index.replace(`${routerConfig.UPLOADER_CONFIG_PAGE}-`, "");
        $router.push({
          name: routerConfig.UPLOADER_CONFIG_PAGE,
          params: {
            type: type2
          }
        });
      }
    };
    function minimizeWindow() {
      sendRPC(IRPCActionType.MINIMIZE_WINDOW);
    }
    function closeWindow() {
      sendRPC(IRPCActionType.CLOSE_WINDOW);
    }
    function openMenu() {
      sendRPC(IRPCActionType.SHOW_MAIN_PAGE_MENU);
    }
    function openMiniWindow() {
      sendRPC(IRPCActionType.OPEN_MINI_WINDOW);
    }
    function handleCopyPicBedConfig() {
      window.electron.clipboard.writeText(picBedConfigString.value);
      ElMessage.success(T("COPY_PICBED_CONFIG_SUCCEED"));
    }
    function setAlwaysOnTop() {
      isAlwaysOnTop.value = !isAlwaysOnTop.value;
      sendRPC(IRPCActionType.MAIN_WINDOW_ON_TOP);
    }
    onBeforeRouteUpdate(async (to) => {
      if (to.params.type) {
        defaultActive.value = `${routerConfig.UPLOADER_CONFIG_PAGE}-${to.params.type}`;
      } else {
        defaultActive.value = to.name;
      }
    });
    onBeforeUnmount(() => {
      window.electron.electronAPI.ipcRenderer.removeAllListeners(SHOW_MAIN_PAGE_QRCODE);
      window.electron.electronAPI.ipcRenderer.removeAllListeners("updateProgress");
    });
    return (_ctx, _cache) => {
      const _component_el_icon = resolveComponent("el-icon");
      const _component_el_progress = resolveComponent("el-progress");
      const _component_el_menu_item = resolveComponent("el-menu-item");
      const _component_el_sub_menu = resolveComponent("el-sub-menu");
      const _component_el_menu = resolveComponent("el-menu");
      const _component_el_col = resolveComponent("el-col");
      const _component_router_view = resolveComponent("router-view");
      const _component_el_row = resolveComponent("el-row");
      const _component_el_option = resolveComponent("el-option");
      const _component_el_select = resolveComponent("el-select");
      const _component_el_button = resolveComponent("el-button");
      const _component_el_form_item = resolveComponent("el-form-item");
      const _component_el_form = resolveComponent("el-form");
      const _component_el_dialog = resolveComponent("el-dialog");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, " PicList - " + toDisplayString(version.value), 1),
          unref(osGlobal) !== "darwin" ? (openBlock(), createElementBlock("div", _hoisted_4, [
            createVNode(_component_el_icon, {
              class: "minus",
              color: isAlwaysOnTop.value ? "#409EFF" : "#fff",
              size: "20",
              style: { "margin-right": "10px" },
              onClick: setAlwaysOnTop
            }, {
              default: withCtx(() => [
                createVNode(unref(arrow_up_bold_default))
              ]),
              _: 1
            }, 8, ["color"]),
            createVNode(_component_el_icon, {
              class: "minus",
              color: "#fff",
              size: "20",
              style: { "margin-right": "10px" },
              onClick: minimizeWindow
            }, {
              default: withCtx(() => [
                createVNode(unref(semi_select_default))
              ]),
              _: 1
            }),
            createVNode(_component_el_icon, {
              class: "plus",
              color: "orange",
              size: "20",
              style: { "margin-right": "10px" },
              onClick: openMiniWindow
            }, {
              default: withCtx(() => [
                createVNode(unref(arrow_down_bold_default))
              ]),
              _: 1
            }),
            createVNode(_component_el_icon, {
              class: "close",
              color: "#fff",
              size: "20",
              onClick: closeWindow
            }, {
              default: withCtx(() => [
                createVNode(unref(close_bold_default))
              ]),
              _: 1
            })
          ])) : createCommentVNode("", true)
        ]),
        isShowprogress.value ? (openBlock(), createBlock(_component_el_progress, {
          key: 0,
          percentage: progress.value,
          "stroke-width": 7,
          "text-inside": true,
          "show-text": false,
          status: "success",
          class: "progress-bar"
        }, null, 8, ["percentage"])) : createCommentVNode("", true),
        createVNode(_component_el_row, {
          style: { "padding-top": "22px" },
          class: "main-content"
        }, {
          default: withCtx(() => [
            createVNode(_component_el_col, { class: "side-bar-menu" }, {
              default: withCtx(() => [
                createVNode(_component_el_menu, {
                  class: "picgo-sidebar",
                  "default-active": defaultActive.value,
                  "unique-opened": true,
                  onSelect: handleSelect
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.UPLOAD_PAGE
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(upload_filled_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("UPLOAD_AREA")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"]),
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.MANAGE_LOGIN_PAGE
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(pie_chart_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("MANAGE_PAGE")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"]),
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.GALLERY_PAGE
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(picture_filled_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("GALLERY")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"]),
                    createVNode(_component_el_sub_menu, {
                      index: "sub-menu",
                      "show-timeout": 0,
                      "hide-timeout": 0,
                      "popper-offset": 0
                    }, {
                      title: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(menu_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("PICBEDS_SETTINGS")), 1)
                      ]),
                      default: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(picBedGlobal), (item) => {
                          return openBlock(), createElementBlock(Fragment, null, [
                            item.visible ? (openBlock(), createBlock(_component_el_menu_item, {
                              key: item.type,
                              index: `${routerConfig.UPLOADER_CONFIG_PAGE}-${item.type}`
                            }, {
                              default: withCtx(() => [
                                createBaseVNode("span", null, toDisplayString(item.name), 1)
                              ]),
                              _: 2
                            }, 1032, ["index"])) : createCommentVNode("", true)
                          ], 64);
                        }), 256))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.SETTING_PAGE
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(tools_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("PICLIST_SETTINGS")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"]),
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.PLUGIN_PAGE
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(share_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("PLUGIN_SETTINGS")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"]),
                    createVNode(_component_el_menu_item, {
                      index: routerConfig.DocumentPage
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_el_icon, null, {
                          default: withCtx(() => [
                            createVNode(unref(link_default))
                          ]),
                          _: 1
                        }),
                        createBaseVNode("span", null, toDisplayString(unref(T)("MANUAL")), 1)
                      ]),
                      _: 1
                    }, 8, ["index"])
                  ]),
                  _: 1
                }, 8, ["default-active"]),
                createVNode(_component_el_icon, {
                  class: "info-window",
                  onClick: openMenu
                }, {
                  default: withCtx(() => [
                    createVNode(unref(info_filled_default))
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            createVNode(_component_el_col, {
              span: 21,
              offset: 3,
              style: { "height": "100%" },
              class: "main-wrapper"
            }, {
              default: withCtx(() => [
                createVNode(_component_router_view, null, {
                  default: withCtx(({ Component }) => [
                    createVNode(Transition, {
                      name: "picgo-fade",
                      mode: "out-in"
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createBlock(KeepAlive, { include: unref(keepAlivePages) }, [
                          (openBlock(), createBlock(resolveDynamicComponent(Component)))
                        ], 1032, ["include"]))
                      ]),
                      _: 2
                    }, 1024)
                  ]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        createVNode(_component_el_dialog, {
          modelValue: qrcodeVisible.value,
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => qrcodeVisible.value = $event),
          class: "qrcode-dialog",
          top: "3vh",
          width: "60%",
          title: unref(T)("PICBED_QRCODE"),
          "modal-append-to-body": false,
          "lock-scroll": "",
          "append-to-body": ""
        }, {
          default: withCtx(() => [
            createVNode(_component_el_form, {
              "label-position": "left",
              "label-width": "70px",
              size: "small"
            }, {
              default: withCtx(() => [
                createVNode(_component_el_form_item, {
                  label: unref(T)("CHOOSE_PICBED")
                }, {
                  default: withCtx(() => [
                    createVNode(_component_el_select, {
                      modelValue: choosedPicBedForQRCode.value,
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => choosedPicBedForQRCode.value = $event),
                      multiple: "",
                      "collapse-tags": "",
                      persistent: false,
                      teleported: ""
                    }, {
                      default: withCtx(() => [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(picBedGlobal), (item) => {
                          return openBlock(), createBlock(_component_el_option, {
                            key: item.type,
                            label: item.name,
                            value: item.type
                          }, null, 8, ["label", "value"]);
                        }), 128))
                      ]),
                      _: 1
                    }, 8, ["modelValue"]),
                    withDirectives(createVNode(_component_el_button, {
                      type: "primary",
                      round: "",
                      class: "copy-picbed-config",
                      onClick: handleCopyPicBedConfig
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(unref(T)("COPY_PICBED_CONFIG")), 1)
                      ]),
                      _: 1
                    }, 512), [
                      [vShow, choosedPicBedForQRCode.value.length > 0]
                    ])
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            }),
            createBaseVNode("div", _hoisted_5, [
              withDirectives(createVNode(QrcodeVue, {
                size: 280,
                value: picBedConfigString.value
              }, null, 8, ["value"]), [
                [vShow, choosedPicBedForQRCode.value.length > 0]
              ])
            ])
          ]),
          _: 1
        }, 8, ["modelValue", "title"]),
        createVNode(_sfc_main$1)
      ]);
    };
  }
});
export {
  _sfc_main as default
};
