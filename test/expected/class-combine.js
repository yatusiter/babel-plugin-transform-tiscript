
class Animation {
    function this(options) {

        options = (options || {});

        this.stage = (options.stage || {});

        this.onframe = (options.onframe || function () {});

        // private properties
        this._clips = [];

        this._running = false;

        this._time;

        this._pausedTime;

        this._pauseStart;

        this._paused = false;

        Dispatcher.call(this);
    }

    function addClip(clip) {
        this._clips.push(clip);
    }

    function addAnimator(animator) {
        animator.animation = this;
        var clips = animator.getClips();
        for (var i = 0; (i < clips.length); i++) {
            this.addClip(clips[i]);
        }
    }

    function removeClip(clip) {
        var idx = util.indexOf(this._clips, clip);
        if (idx >= 0) {
            this._clips.splice(idx, 1);
        }
    }

    function removeAnimator(animator) {
        var clips = animator.getClips();
        for (var i = 0; (i < clips.length); i++) {
            this.removeClip(clips[i]);
        }
        animator.animation = null;
    }

    function _update() {
        var time = (new Date().getTime() - this._pausedTime);
        var delta = (time - this._time);
        var clips = this._clips;
        var len = clips.length;

        var deferredEvents = [];
        var deferredClips = [];
        for (var i = 0; (i < len); i++) {
            var clip = clips[i];
            var e = clip.step(time, delta);
            // Throw out the events need to be called after
            // stage.update, like destroy
            if (e) {
                deferredEvents.push(e);
                deferredClips.push(clip);
            }
        }

        // Remove the finished clip
        for (var i = 0; (i < len);) {
            if (clips[i]._needsRemove) {
                clips[i] = clips[(len - 1)];
                clips.pop();
                len--;
            } else {
                i++;
            }
        }

        len = deferredEvents.length;
        for (var i = 0; (i < len); i++) {
            deferredClips[i].fire(deferredEvents[i]);
        }

        this._time = time;

        this.onframe(delta);

        // 'frame' should be triggered before stage, because upper application
        // depends on the sequence (e.g., echarts-stream and finish
        // event judge)
        this.trigger("frame", delta);

        if (this.stage.update) {
            this.stage.update();
        }
    }

    function _startLoop() {
        var self = this;

        this._running = true;

        function step() {
            if (self._running) {

                requestAnimationFrame(step);

                !self._paused && self._update();
            }
        }

        requestAnimationFrame(step);
    }

    function start() {

        this._time = new Date().getTime();
        this._pausedTime = 0;

        this._startLoop();
    }

    function stop() {
        this._running = false;
    }

    function pause() {
        if (!this._paused) {
            this._pauseStart = new Date().getTime();
            this._paused = true;
        }
    }

    function resume() {
        if (this._paused) {
            this._pausedTime += (new Date().getTime() - this._pauseStart);
            this._paused = false;
        }
    }

    function clear() {
        this._clips = [];
    }

    function isFinished() {
        return !this._clips.length;
    }

    function animate(target, options) {
        options = (options || {});

        var animator = new Animator(target, options.loop, options.getter, options.setter);

        this.addAnimator(animator);

        return animator;
    }

}
