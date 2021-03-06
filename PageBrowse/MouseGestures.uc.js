// ==UserScript==
// @name                 Mousegestures.uc.js
// @namespace            Mousegestures@gmail.com
// @description          自定義滑鼠手勢
// @author          紫雲飛&w13998686967&黒仪大螃蟹
// @include         chrome://browser/content/browser.xul
// @homepageURL          http://www.cnblogs.com/ziyunfei/archive/2011/12/15/2289504.html
// @version         2016.8.23
// @note         2016.8.23 DOMMouseScroll==>wheel
// @note         2016.8.21 增加開關 by skofkyo 
// @note         2016.2.22  取用黒仪大蚂蚁的描繪軌跡 by w13998686967
// @note         2014.11.02 搜集修改自網絡各種代碼，配置外放，自用 DIY版 by w13998686967
// @charset              UTF-8
// ==/UserScript==
(function() {
    var ucjsMouseGestures = {
        Locus: true, // true / false 是否使用手勢描繪軌跡
        mgbtn: false, // true / false 執行手勢後是否取消按左右鍵(影響連續搖擺手勢)
        trailColor: '#ff1f1f', // 軌跡顏色
        trailSize: 3, // 軌跡粗細 單位px
        lastX: 0,
        lastY: 0,
        sourceNode: "",
        directionChain: "",
        isMouseDownL: false,
        isMouseDownR: false,
        hideFireContext: false,
        shouldFireContext: false,
        GESTURES: {},
        createMenuitem: function() {
            var menuitem = document.createElement('menuitem');
            menuitem.setAttribute('id', 'ucjsMouseGestures');
            menuitem.setAttribute('class', 'menuitem-iconic');
            menuitem.setAttribute('label', '設置滑鼠手勢');
            menuitem.setAttribute('class', 'menuitem-iconic');
            menuitem.setAttribute('tooltiptext', '左鍵：重載配置\n右鍵：編輯配置');
            menuitem.setAttribute('oncommand', 'ucjsMouseGestures.reload(true);');
            menuitem.setAttribute('onclick', 'if (event.button == 2) { event.preventDefault(); closeMenus(event.currentTarget); ucjsMouseGestures.edit(ucjsMouseGestures.file); }');
            menuitem.setAttribute('image', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAB9VBMVEX///8BAgkAAAA2Q19OVm08SWY/TGo0SW1BTmtCT25EUG4gL04+S2k8SmckM1Y9S2k+TGk+SWRGUWw9SmhIU2w+TGpASmRLVG01SXBDTGRGTmUPGSRGTmRKU2tBS2JGUGo+SGFDTmk7R2BCUGw7SGUlM1QWIjwjMVE+TGk7SGQ6R2I5RmE4RWE3RGA3RF85R2QWIjwAAAAAAACuyuJkmc++3//Y7v9nms/N3u/4+v3X7v9BgsPZ8v/g6vXa8P+r0v+kzv9Bg8V7qNe40Oer0/9mm9Bbk8yIsNrT4vHW5PLU4/LK3O7///9+qdXG6P+Mt9yZxvu/4P9Ag8Xj+f8ZabhlmM0rdL4vdr8aaLmErtp8qdclcb2Yxvqz1v+Pt92+3P+nzv9NiMfP8f/Q4PG/1evF2e240On2+fxmmc5nndKRwfigwN3Z7/+dyf8ebLnJ3O7A1uwqc71Pi8hNishQjMl9q9iyzOOwzeOy2P93p9V/rNdwodPF2e5Tj8mmxOOhwuJlnNCw1v9FhcZAgcTD4v+Fr9aOttx3pdORud6Is9uDr9mQut/E5//X8f+yzeK01//L6/9kmM6+4P9clc273f+83v/K6/+kxvvZ8P+hwN2KsdjY7/+vyuKPttm/3/+Tt9uayP9oms+32v9ck8qUuNvV4/Ibabm8pjtFAAAAM3RSTlMAAACvg4ODUYODjWyDg1m3g7KFg4ODr4NTr68Ar4Ovg6+EsI64V5NvrLGvr6+vr7GVMAE/4vyBAAAA6klEQVR4XmXIw5IDARQAwEzsrG1b49g2lrZt27aN78zLbau2j834LzVJwOdGiWMlHE68FIHgdQbU98NPBCEnAm0iCKHydOhhFkXRZ3TuRAYRs71jMDy+ge+X12iIuM8vlSrkithrSYBI1CgoqoMkPy76r9qTIdgjo2PjE5NT05tbfm9KJN6Dyz+/tXX1DY1NzWkQ6Vqdnu7q7untcw4MZkBkGk1mi9Vmd9DOGW8WRPb8wuIShmErq2vrGzkQuW7PbivYPzg8Os6DyD879/kucRy/vrm9K4BACouKS0rLyitYrMqqagjmXzWMMFkIPrUu5Kd5AAAAAElFTkSuQmCC');
            var insPos = document.getElementById('devToolsSeparator');
            insPos.parentNode.insertBefore(menuitem, insPos);
        },
        init: function() {
            this.reload();
            var self = this;
            ["mousedown", "mousemove", "mouseup", "contextmenu", "wheel", "dragend"].forEach(function(type) {
                gBrowser.mPanelContainer.addEventListener(type, self, true);
            });
            window.addEventListener("unload", function() {
                ["mousedown", "mousemove", "mouseup", "contextmenu", "wheel", "dragend"].forEach(function(type) {
                    gBrowser.mPanelContainer.removeEventListener(type, self, true);
                });
            }, false);
        },
        reload: function(isAlert) {
            var file = this.getMouseGesturesFile();
            if (!file.exists()) return this.alert('Load Error: 配置文件不存在');
            try {
                this.importMouseGestures(file);
            } catch (e) {
                this.alert('Error: ' + e + '\n請重新檢查配置文件');
                return;
            }
            if (isAlert) this.alert('配置已經重新載入');
        },
        alert: function(aString, aTitle) {
            Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService).showAlertNotification("", aTitle || "MouseGestures", aString, false, "", null);
        },
        getMouseGesturesFile: function() {
            var aFile = Services.dirsvc.get("UChrm", Ci.nsILocalFile);
            aFile.appendRelativePath("Local");
            aFile.appendRelativePath("_mouseGestures.js");
            if (!aFile.exists() || !aFile.isFile()) return null;
            delete this.file;
            return this.file = aFile;
        },
        importMouseGestures: function(file) {
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(file, -1, 0, 0);
            sstream.init(fstream);
            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) {}
            sstream.close();
            fstream.close();
            this.GESTURES = new Function('', 'return ' + data)();
            return;
        },
        edit: function(aFile) {
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;
            var editor;
            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsILocalFile);
            } catch (e) {
                this.alert("請設置編輯器的路徑。\nview_source.editor.path");
                toOpenWindowByType('pref:pref', 'about:config?filter=view_source.editor.path');
                return;
            }
            var UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            UI.charset = window.navigator.platform.toLowerCase().indexOf("win") >= 0 ? "gbk" : "UTF-8";
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);

            try {
                var path = UI.ConvertFromUnicode(aFile.path);
                var args = [path];
                process.init(editor);
                process.run(false, args, args.length);
            } catch (e) {
                this.alert("編輯器不正確！")
            }
        },
        handleEvent: function(event) {
            if (event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            } //按住ctrl,shift,alt鍵不起效
            switch (event.type) {
                case "mousedown":
                    if (/object|embed/i.test(event.target.localName)) return;
                    if (event.button == 2) {
                        this.sourceNode = event.target;
                        this.isMouseDownR = true;
                        this.hideFireContext = false;
                        [this.lastX, this.lastY, this.directionChain] = [event.screenX, event.screenY, ""];
                    }
                    if (event.button == 2 && this.isMouseDownL) {
                        this.isMouseDownR = false;
                        this.shouldFireContext = false;
                        this.hideFireContext = true;
                        this.directionChain = "L>R";
                        this.stopGesture(event);
                    } else if (event.button == 0) {
                        this.isMouseDownL = true;
                        if (this.isMouseDownR) {
                            this.isMouseDownL = false;
                            this.shouldFireContext = false;
                            this.hideFireContext = true;
                            this.directionChain = "L<R";
                            this.stopGesture(event);
                        }
                    }
                    break;
                case "mousemove":
                    if (this.isMouseDownR) {
                        this.hideFireContext = true;
                        var [subX, subY] = [event.screenX - this.lastX, event.screenY - this.lastY];
                        var [distX, distY] = [(subX > 0 ? subX : (-subX)), (subY > 0 ? subY : (-subY))];
                        var direction;
                        if (distX < 10 && distY < 10) return;
                        if (distX > distY)
                            direction = subX < 0 ? "L" : "R";
                        else
                            direction = subY < 0 ? "U" : "D";
                        if (this.Locus) {
                            var browser = gBrowser.selectedBrowser;
                            if (!this.xdTrailArea) {
                                this.xdTrailArea = document.createElement("hbox");
                                var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
                                canvas.setAttribute("width", window.screen.width);
                                canvas.setAttribute("height", window.screen.height);
                                this.xdTrailAreaContext = canvas.getContext("2d");
                                this.xdTrailArea.style.cssText = "display: -moz-box !important;" +
                                    "box-sizing: border-box !important;" +
                                    "pointer-events: none !important;" +
                                    "width:100% !important;" +
                                    "height:100% !important;" +
                                    "overflow:hidden !important;" +
                                    "opacity:.9 !important;";
                                this.xdTrailArea.appendChild(canvas);
                                browser.parentNode.insertBefore(this.xdTrailArea, browser.nextSibling);
                            }
                            if (this.xdTrailAreaContext) {
                                this.xdTrailAreaContext.strokeStyle = this.trailColor;
                                this.xdTrailAreaContext.lineJoin = "round";
                                this.xdTrailAreaContext.lineWidth = this.trailSize;
                                this.xdTrailAreaContext.beginPath();
                                this.xdTrailAreaContext.moveTo(this.lastX - browser.boxObject.screenX, this.lastY - browser.boxObject.screenY);
                                this.xdTrailAreaContext.lineTo(event.screenX - browser.boxObject.screenX, event.screenY - browser.boxObject.screenY);
                                this.xdTrailAreaContext.closePath();
                                this.xdTrailAreaContext.stroke();
                                this.lastX = event.screenX;
                                this.lastY = event.screenY;
                            }
                        }
                        if (direction != this.directionChain.charAt(this.directionChain.length - 1)) {
                            this.directionChain += direction;
                            XULBrowserWindow.statusTextField.label = this.GESTURES[this.directionChain] ? "手勢: " + this.directionChain + " " + this.GESTURES[this.directionChain].name : "未知手勢:" + this.directionChain;
                        }
                        this.lastX = event.screenX;
                        this.lastY = event.screenY;
                    }
                    break;
                case "mouseup":
                    if (this.Locus) {
                        if (this.xdTrailArea) {
                            this.xdTrailArea.parentNode.removeChild(this.xdTrailArea);
                            this.xdTrailArea = null;
                            this.xdTrailAreaContext = null;
                        }
                    }
                    if (event.ctrlKey && event.button == 2) {
                        this.isMouseDownL = false;
                        this.isMouseDownR = false;
                        this.shouldFireContext = false;
                        this.hideFireContext = false;
                        this.directionChain = "";
                        event.preventDefault();
                        XULBrowserWindow.statusTextField.label = "取消手勢";
                        break;
                    }
                    if (this.isMouseDownR && event.button == 2) {
                        if (this.directionChain) this.shouldFireContext = false;
                        this.isMouseDownR = false;
                        this.directionChain && this.stopGesture(event);
                    } else if (event.button == 0 && this.isMouseDownL) {
                        this.isMouseDownL = false;
                        this.shouldFireContext = false;
                    }
                    break;
                case "contextmenu":
                    if (this.isMouseDownL || this.isMouseDownR || this.hideFireContext) {
                        var pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
                        var contextmenu = pref.getBoolPref("dom.event.contextmenu.enabled");
                        pref.setBoolPref("dom.event.contextmenu.enabled", true);
                        setTimeout(function() {
                            pref.setBoolPref("dom.event.contextmenu.enabled", contextmenu);
                        }, 10);
                        event.preventDefault();
                        event.stopPropagation();
                        this.shouldFireContext = true;
                        this.hideFireContext = false;
                    }
                    break;
                case "wheel":
                    if (this.isMouseDownR) {
                        this.shouldFireContext = false;
                        this.hideFireContext = true;
                        this.directionChain = "W" + (event.deltaY > 0 ? "+" : "-");
                        this.stopGesture(event);
                    }
                    break;
                case "dragend":
                    this.isMouseDownL = false;
            }
        },
        stopGesture: function(event) {
            (this.GESTURES[this.directionChain] ? this.GESTURES[this.directionChain].cmd(this, event) & (XULBrowserWindow.statusTextField.label = "") : (XULBrowserWindow.statusTextField.label = "未知手勢:" + this.directionChain)) & (this.directionChain = "");
            //if (this.GESTURES[this.directionChain]) this.GESTURES[this.directionChain].cmd(this, event);
            //this.directionChain = "";
            XULBrowserWindow.statusTextField.label = ""; // 清除提示
            this.xdTrailArea = null; // 修復與nextpage的衝突，當nextpage啟用預讀時只能被MouseDragGestures調用一次，不能接著再用
            event.preventDefault();
            event.stopPropagation();
            if (this.mgbtn) {
                this.isMouseDownL = false;
                //this.isMouseDownM = false;
                this.isMouseDownR = false; // 取消鼠標按鍵
            }
            this.hideFireContext = true;
        }
    };
    ucjsMouseGestures.createMenuitem();
    ucjsMouseGestures.init();
    window.ucjsMouseGestures = ucjsMouseGestures;
})();