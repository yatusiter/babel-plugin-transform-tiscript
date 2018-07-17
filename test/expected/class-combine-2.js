
class Group {
    function this(opts) {

        opts = (opts || {});

        Element.call(this, opts);

        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                this[key] = opts[key];
            }
        }

        this._children = [];

        this.__storage = null;

        this.__dirty = true;
    }

    this var isGroup = true;
    this var type = "group";
    this var silent = false;

    function children() {
        return this._children.slice();
    }

    function childAt(idx) {
        return this._children[idx];
    }

    function childOfName(name) {
        var children = this._children;
        for (var i = 0; (i < children.length); i++) {
            if (children[i].name === name) {
                return children[i];
            }
        }
    }

    function childCount() {
        return this._children.length;
    }

    function add(child) {
        if ((child && (child !== this)) && (child.parent !== this)) {

            this._children.push(child);

            this._doAdd(child);
        }

        return this;
    }

    function addBefore(child, nextSibling) {
        if ((((child && (child !== this)) && (child.parent !== this)) && nextSibling) && (nextSibling.parent === this)) {

            var children = this._children;
            var idx = children.indexOf(nextSibling);

            if (idx >= 0) {
                children.splice(idx, 0, child);
                this._doAdd(child);
            }
        }

        return this;
    }

    function _doAdd(child) {
        if (child.parent) {
            child.parent.remove(child);
        }

        child.parent = this;

        var storage = this.__storage;
        var zr = this.__zr;
        if (storage && (storage !== child.__storage)) {

            storage.addToStorage(child);

            if (child instanceof Group) {
                child.addChildrenToStorage(storage);
            }
        }

        zr && zr.refresh();
    }

    function remove(child) {
        var zr = this.__zr;
        var storage = this.__storage;
        var children = this._children;

        var idx = zrUtil.indexOf(children, child);
        if (idx < 0) {
            return this;
        }
        children.splice(idx, 1);

        child.parent = null;

        if (storage) {

            storage.delFromStorage(child);

            if (child instanceof Group) {
                child.delChildrenFromStorage(storage);
            }
        }

        zr && zr.refresh();

        return this;
    }

    function removeAll() {
        var children = this._children;
        var storage = this.__storage;
        var child;
        var i;
        for (i = 0; (i < children.length); i++) {
            child = children[i];
            if (storage) {
                storage.delFromStorage(child);
                if (child instanceof Group) {
                    child.delChildrenFromStorage(storage);
                }
            }
            child.parent = null;
        }
        children.length = 0;

        return this;
    }

    function eachChild(cb, context) {
        var children = this._children;
        for (var i = 0; (i < children.length); i++) {
            var child = children[i];
            cb.call(context, child, i);
        }
        return this;
    }

    function traverse(cb, context) {
        for (var i = 0; (i < this._children.length); i++) {
            var child = this._children[i];
            cb.call(context, child);

            if (child.type === "group") {
                child.traverse(cb, context);
            }
        }
        return this;
    }

    function addChildrenToStorage(storage) {
        for (var i = 0; (i < this._children.length); i++) {
            var child = this._children[i];
            storage.addToStorage(child);
            if (child instanceof Group) {
                child.addChildrenToStorage(storage);
            }
        }
    }

    function delChildrenFromStorage(storage) {
        for (var i = 0; (i < this._children.length); i++) {
            var child = this._children[i];
            storage.delFromStorage(child);
            if (child instanceof Group) {
                child.delChildrenFromStorage(storage);
            }
        }
    }

    function dirty() {
        this.__dirty = true;
        this.__zr && this.__zr.refresh();
        return this;
    }

    function getBoundingRect(includeChildren) {
        // TODO Caching
        var rect = null;
        var tmpRect = new BoundingRect(0, 0, 0, 0);
        var children = (includeChildren || this._children);
        var tmpMat = [];

        for (var i = 0; (i < children.length); i++) {
            var child = children[i];
            if (child.ignore || child.invisible) {
                continue;
            }

            var childRect = child.getBoundingRect();
            var transform = child.getLocalTransform(tmpMat);
            // TODO
            // The boundingRect cacluated by transforming original
            // rect may be bigger than the actual bundingRect when rotation
            // is used. (Consider a circle rotated aginst its center, where
            // the actual boundingRect should be the same as that not be
            // rotated.) But we can not find better approach to calculate
            // actual boundingRect yet, considering performance.
            if (transform) {
                tmpRect.copy(childRect);
                tmpRect.applyTransform(transform);
                rect = (rect || tmpRect.clone());
                rect.union(tmpRect);
            } else {
                rect = (rect || childRect.clone());
                rect.union(childRect);
            }
        }
        return rect || tmpRect;
    }

}
