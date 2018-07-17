// Common handlers
util.each(["click", "mousedown", "mouseup", "mousewheel", "dblclick", "contextmenu"], function (name) {
    Handler.prototype[name] = function (event) {
        // Find hover again to avoid click event is dispatched manually. Or click is triggered without mouseover
        var hovered = this.findHover(event.zrX, event.zrY);
        var hoveredTarget = hovered.target;

        if (name === "mousedown") {
            this._downEl = hoveredTarget;
            this._downPoint = [event.zrX, event.zrY];
            // In case click triggered before mouseup
            this._upEl = hoveredTarget;
        } else if (name === "mouseup") {
            this._upEl = hoveredTarget;
        } else if (name === "click") {
            if (((this._downEl !== this._upEl)
            // Original click event is triggered on the whole canvas element,
            // including the case that `mousedown` - `mousemove` - `mouseup`,
            // which should be filtered, otherwise it will bring trouble to
            // pan and zoom.
            || !this._downPoint)
            // Arbitrary value
            || (vec2.dist(this._downPoint, [event.zrX, event.zrY]) > 4)) {
                return;
            }
            this._downPoint = null;
        }

        this.dispatchToElement(hovered, name, event);
    };
});

class Handler {
    function this(storage, painter, proxy, painterRoot) {
        Eventful.call(this);

        this.storage = storage;

        this.painter = painter;

        this.painterRoot = painterRoot;

        proxy = (proxy || new EmptyProxy());

        /**
         * Proxy of event. can be Dom, WebGLSurface, etc.
         */
        this.proxy = null;

        /**
         * {target, topTarget, x, y}
         * @private
         * @type {Object}
         */
        this._hovered = {};

        /**
         * @private
         * @type {Date}
         */
        this._lastTouchMoment;

        /**
         * @private
         * @type {number}
         */
        this._lastX;

        /**
         * @private
         * @type {number}
         */
        this._lastY;

        Draggable.call(this);

        this.setHandlerProxy(proxy);
    }

    function setHandlerProxy(proxy) {
        if (this.proxy) {
            this.proxy.dispose();
        }

        if (proxy) {
            util.each(handlerNames, function (name) {
                proxy.on && proxy.on(name, this[name], this);
            }, this);
            // Attach handler
            proxy.handler = this;
        }
        this.proxy = proxy;
    }

    function mousemove(event) {
        var x = event.zrX;
        var y = event.zrY;

        var lastHovered = this._hovered;
        var lastHoveredTarget = lastHovered.target;

        // If lastHoveredTarget is removed from zr (detected by '__zr') by some API call
        // (like 'setOption' or 'dispatchAction') in event handlers, we should find
        // lastHovered again here. Otherwise 'mouseout' can not be triggered normally.
        // See #6198.
        if (lastHoveredTarget && !lastHoveredTarget.__zr) {
            lastHovered = this.findHover(lastHovered.x, lastHovered.y);
            lastHoveredTarget = lastHovered.target;
        }

        var hovered = this._hovered = this.findHover(x, y);
        var hoveredTarget = hovered.target;

        var proxy = this.proxy;
        proxy.setCursor && proxy.setCursor(hoveredTarget ? hoveredTarget.cursor : "default");

        // Mouse out on previous hovered element
        if (lastHoveredTarget && (hoveredTarget !== lastHoveredTarget)) {
            this.dispatchToElement(lastHovered, "mouseout", event);
        }

        // Mouse moving on one element
        this.dispatchToElement(hovered, "mousemove", event);

        // Mouse over on a new element
        if (hoveredTarget && (hoveredTarget !== lastHoveredTarget)) {
            this.dispatchToElement(hovered, "mouseover", event);
        }
    }

    function mouseout(event) {
        this.dispatchToElement(this._hovered, "mouseout", event);

        // There might be some doms created by upper layer application
        // at the same level of painter.getViewportRoot() (e.g., tooltip
        // dom created by echarts), where 'globalout' event should not
        // be triggered when mouse enters these doms. (But 'mouseout'
        // should be triggered at the original hovered element as usual).
        var element = (event.toElement || event.relatedTarget);
        var innerDom;
        do {
            element = (element && element.parentNode);
        } while (((element && (element.nodeType != 9)) && !(innerDom = (element === this.painterRoot))));

        !innerDom && this.trigger("globalout", { event: event });
    }

    function resize(event) {
        this._hovered = {};
    }

    function dispatch(eventName, eventArgs) {
        var handler = this[eventName];
        handler && handler.call(this, eventArgs);
    }

    function dispose() {

        this.proxy.dispose();

        this.storage = this.proxy = this.painter = null;
    }

    function setCursorStyle(cursorStyle) {
        var proxy = this.proxy;
        proxy.setCursor && proxy.setCursor(cursorStyle);
    }

    function dispatchToElement(targetInfo, eventName, event) {
        targetInfo = (targetInfo || {});
        var el = targetInfo.target;
        if (el && el.silent) {
            return;
        }
        var eventHandler = ("on" + eventName);
        var eventPacket = makeEventPacket(eventName, targetInfo, event);

        while (el) {
            el[eventHandler] && (eventPacket.cancelBubble = el[eventHandler].call(el, eventPacket));

            el.trigger(eventName, eventPacket);

            el = el.parent;

            if (eventPacket.cancelBubble) {
                break;
            }
        }

        if (!eventPacket.cancelBubble) {
            // 冒泡到顶级 zrender 对象
            this.trigger(eventName, eventPacket);
            // 分发事件到用户自定义层
            // 用户有可能在全局 click 事件中 dispose，所以需要判断下 painter 是否存在
            this.painter && this.painter.eachOtherLayer(function (layer) {
                if (typeof layer[eventHandler] == "function") {
                    layer[eventHandler].call(layer, eventPacket);
                }
                if (layer.trigger) {
                    layer.trigger(eventName, eventPacket);
                }
            });
        }
    }

    function findHover(x, y, exclude) {
        var list = this.storage.getDisplayList();
        var out = { x: x, y: y };

        for (var i = (list.length - 1); (i >= 0); i--) {
            var hoverCheckResult;
            if (((list[i] !== exclude)
            // getDisplayList may include ignored item in VML mode
            && !list[i].ignore) && (hoverCheckResult = isHover(list[i], x, y))) {
                !out.topTarget && (out.topTarget = list[i]);
                if (hoverCheckResult !== SILENT) {
                    out.target = list[i];
                    break;
                }
            }
        }

        return out;
    }

}
