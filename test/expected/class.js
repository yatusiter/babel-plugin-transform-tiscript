function NonClass(name) {
    this.name = name;
}

var test = "balabala";

class Person {
    function this(name) {
        this.name = name;
    }

    function greet() {
        return "Hello, " + this.name;
    }

}

class Employee : Person {
    function this(name, salary) {
        Person.call(this, name);
        this.salary = salary;
    }

    this var flag = true;
    this var str = "test string";

    function grantRaise(percent) {
        this.salary = (this.salary * percent).toInt();
    }

}

function Test(name) {
    this.name = name;
}

class Transformable {
    function this(opts) {
        opts = (opts || {});
        // If there are no given position, rotation, scale
        if (!opts.position) {
            /**
             * 平移
             * @type {Array.<number>}
             * @default [0, 0]
             */
            this.position = [0, 0];
        }
        if (opts.rotation == null) {
            /**
             * 旋转
             * @type {Array.<number>}
             * @default 0
             */
            this.rotation = 0;
        }
        if (!opts.scale) {
            /**
             * 缩放
             * @type {Array.<number>}
             * @default [1, 1]
             */
            this.scale = [1, 1];
        }
        /**
         * 旋转和缩放的原点
         * @type {Array.<number>}
         * @default null
         */
        this.origin = (this.origin || null);
    }

    this var transform = null;

    function needLocalTransform() {
        return (((isNotAroundZero(this.rotation) || isNotAroundZero(this.position[0])) || isNotAroundZero(this.position[1])) || isNotAroundZero((this.scale[0] - 1))) || isNotAroundZero((this.scale[1] - 1));
    }

    function updateTransform() {
        var parent = this.parent;
        var parentHasTransform = (parent && parent.transform);
        var needLocalTransform = this.needLocalTransform();

        var m = this.transform;
        if (!(needLocalTransform || parentHasTransform)) {
            m && mIdentity(m);
            return;
        }

        m = (m || matrix.create());

        if (needLocalTransform) {
            this.getLocalTransform(m);
        } else {
            mIdentity(m);
        }

        // 应用父节点变换
        if (parentHasTransform) {
            if (needLocalTransform) {
                matrix.mul(m, parent.transform, m);
            } else {
                matrix.copy(m, parent.transform);
            }
        }
        // 保存这个变换矩阵
        this.transform = m;

        this.invTransform = (this.invTransform || matrix.create());
        matrix.invert(this.invTransform, m);
    }

    function getLocalTransform(m) {
        return Transformable.getLocalTransform(this, m);
    }

    function setTransform(ctx) {
        var m = this.transform;
        var dpr = (ctx.dpr || 1);
        if (m) {
            ctx.setTransform((dpr * m[0]), (dpr * m[1]), (dpr * m[2]), (dpr * m[3]), (dpr * m[4]), (dpr * m[5]));
        } else {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    function restoreTransform(ctx) {
        var dpr = (ctx.dpr || 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

}

transformableProto = null;

/**
 * 判断是否需要有坐标变换
 * 如果有坐标变换, 则从position, rotation, scale以及父节点的transform计算出自身的transform矩阵
 */


/**
 * 将自己的transform应用到context上
 * @param {CanvasRenderingContext2D} ctx
 */
