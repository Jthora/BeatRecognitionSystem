///<reference path="./basicEQ.d.ts"/>
///<reference path="./cocos2d.d.ts"/>
var eq;
(function (eq) {
    var basicEQ = (function () {
        function basicEQ(containerView) {
            var _this = this;
            this.togglePause = function () {
                if (_this.paused) {
                    _this.play();
                    _this.paused = false;
                } else {
                    _this.pause();
                    _this.paused = true;
                }
            };
            this.pause = function () {
                _this.sourceNode.stop();
                _this.startOffset = _this.context.currentTime - _this.startTime;
            };
            this.play = function () {
                _this.startTime = _this.context.currentTime;
                _this.sourceNode = _this.context.createBufferSource();

                _this.sourceNode.buffer = _this.audioBuffer;
                _this.sourceNode.loop = true;
                _this.sourceNode.connect(_this.context.destination);
                _this.sourceNode.connect(_this.analyser);
                _this.sourceNode.start(0, _this.startOffset % _this.audioBuffer.duration);
            };
            this.buildBeatLights = function () {
                for (var i = 0; i < 4; i++) {
                    var indicator = cc.Sprite.create("res/beat_indicator_bg.png", cc.rect(0, 0, 80, 80), false);
                    indicator.setPosition(1300, 2000 - (i * 100));
                    var light;
                    switch (i) {
                        default:
                        case 0:
                            light = cc.Sprite.create("res/beat_indicator_light_blue.png", cc.rect(0, 0, 80, 80), false);
                            break;
                        case 1:
                            light = cc.Sprite.create("res/beat_indicator_light_orange.png", cc.rect(0, 0, 80, 80), false);
                            break;
                        case 2:
                            light = cc.Sprite.create("res/beat_indicator_light_green.png", cc.rect(0, 0, 80, 80), false);
                            break;
                        case 3:
                            light = cc.Sprite.create("res/beat_indicator_light_hotpink.png", cc.rect(0, 0, 80, 80), false);
                            break;
                    }
                    light.setPosition(40, 40);
                    indicator.light = light;
                    indicator.addChild(light);
                    _this.beatIndicators[i] = indicator;
                    _this.beatIndicators[i].light.visible = false;
                    _this.containerView.addChild(_this.beatIndicators[i]);
                }
            };
            this.Uint8ArrayToJSArray = function (uint8array) {
                return;
            };
            this.setupAudioNodes = function () {
                _this.sourceNode = _this.context.createBufferSource();

                // and connect to destination
                _this.sourceNode.connect(_this.context.destination);
            };
            this.getGradient = function () {
                var gradient = _this.context.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(1, '#000000');
                gradient.addColorStop(0.75, '#ff0000');
                gradient.addColorStop(0.25, '#ffff00');
                gradient.addColorStop(0, '#ffffff');
                return gradient;
            };
            this.getAverageVolume = function (array) {
                var values = 0;
                var average;
                var length = array.length;

                for (var i = 0; i < length; i++) {
                    values += array[i];
                }

                average = values / length;
                return average;
            };
            this.playSound = function () {
                //console.log("this.sourceNode: ",this.sourceNode);
                _this.sourceNode.buffer = _this.audioBuffer;
                _this.sourceNode.loop = true;
                _this.sourceNode.start(0);
            };
            this.onError = function (e) {
                console.log(e);
            };
            this.loadSound = function (url) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request.delegate = _this;

                // When loaded decode the data
                request.onload = function () {
                    //decode the data
                    this.delegate.context.decodeAudioData(request.response, function (buffer) {
                        request.delegate.audioBuffer = buffer;
                        request.delegate.playSound();
                    }, request.delegate.onError);
                };
                request.send();
            };
            this.hitBeat = function (channel) {
                if (_this.beatSprites[channel] == null) {
                    var s;
                    if (channel % 2 == 0)
                        s = cc.Sprite.create("res/bar_blue_bright.png", cc.rect(0, 0, 40, 2), false);
                    else
                        s = cc.Sprite.create("res/bar_orange_bright.png", cc.rect(0, 0, 40, 2), false);
                    _this.beatSprites[channel] = s;
                    _this.beatSprites[channel].setPosition(700, (channel * 4) + 150);
                    _this.containerView.addChild(_this.beatSprites[channel]);
                } else {
                    if (channel % 2 == 0) {
                        _this.beatSprites[channel].setTexture("res/bar_blue_bright.png");
                    } else {
                        _this.beatSprites[channel].setTexture("res/bar_orange_bright.png");
                    }
                }
                _this.beatSprites[channel].isHit = true;
                _this.beatSprites[channel].setScaleX(25 * (_this.volumeThresholds[channel] / 256));
            };
            this.cullBeat = function (channel) {
                if (_this.beatSprites[channel] == null) {
                    var s;
                    if (channel % 2 == 0)
                        s = cc.Sprite.create("res/bar_blue.png", cc.rect(0, 0, 40, 2), false);
                    else
                        s = cc.Sprite.create("res/bar_orange.png", cc.rect(0, 0, 40, 2), false);
                    _this.beatSprites[channel] = s;
                    _this.beatSprites[channel].setPosition(700, (channel * 4) + 150);
                    _this.containerView.addChild(_this.beatSprites[channel]);
                }
                if (_this.beatSprites[channel].getScaleX() >= 0.01) {
                    _this.beatSprites[channel].setScaleX(_this.beatSprites[channel].getScaleX() * 0.95);
                }
                if (_this.beatSprites[channel].isHit == true) {
                    _this.beatSprites[channel].isHit = false;
                    if (channel % 2 == 0) {
                        _this.beatSprites[channel].setTexture("res/bar_blue.png");
                    } else {
                        _this.beatSprites[channel].setTexture("res/bar_orange.png");
                    }
                }
            };
            this.containerView = containerView;

            this.firstRun = true;
            this.paused = false;
            this.startOffset = 0;
            this.startTime = 0;

            this.volumeThresholds = [];
            this.volumeThresholdDecay = [];
            this.thresholdDecayWaits = [];
            this.thresholdDecayRates = [];
            this.beatHoldTimes = [];

            this.beatSprites = [];
            this.beatIndicators = [];

            this.cycles = 0;

            this.context = new webkitAudioContext();
            this.setupAudioNodes();

            this.analyser = this.context.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.3;
            this.analyser.fftSize = 1024;

            this.javascriptNode = this.context.createScriptProcessor(2048, 1, 1);
            this.javascriptNode.delegate = this;
            this.javascriptNode.onaudioprocess = function () {
                //*
                var array = new Uint8Array(this.delegate.analyser.frequencyBinCount);
                this.delegate.analyser.getByteFrequencyData(array);
                var average = this.delegate.getAverageVolume(array);

                if (this.delegate.firstRun) {
                    this.delegate.volumeThresholds = Array.apply([], array);
                    for (var i = 0; i < array.length; i++) {
                        this.delegate.volumeThresholdDecay[i] = 0; // Current Decay Level
                        this.delegate.thresholdDecayWaits[i] = 1; // Cycles Until Decay Begins
                        this.delegate.thresholdDecayRates[i] = 0.1; // Multiplier for Decay
                    }
                    this.delegate.firstRun = false;
                }

                var cycle = this.delegate.cycles;
                cycle++;

                var vt = this.delegate.volumeThresholds;
                var vtd = this.delegate.volumeThresholdDecay;
                var tdw = this.delegate.thresholdDecayWaits;
                var tdr = this.delegate.thresholdDecayRates;

                var beatsThisCycle = 0;
                if (!this.delegate.paused) {
                    for (var i = 0; i < array.length; i++) {
                        if (vt[i] < array[i]) {
                            beatsThisCycle++;
                            vt[i] = array[i];
                            vtd[i] = 0;
                            this.delegate.hitBeat(i);
                        } else {
                            vtd[i]++;
                            if (vtd[i] > tdw[i]) {
                                vt[i] *= tdr[i];
                                this.delegate.cullBeat(i);
                            }
                        }
                        if (beatsThisCycle > array.length / 5) {
                            this.delegate.beatIndicators[0].light.visible = true;
                            if (beatsThisCycle > array.length / 4) {
                                this.delegate.beatIndicators[1].light.visible = true;
                                if (beatsThisCycle > array.length / 3) {
                                    this.delegate.beatIndicators[2].light.visible = true;
                                    if (beatsThisCycle > array.length / 2) {
                                        this.delegate.beatIndicators[3].light.visible = true;
                                    } else {
                                        this.delegate.beatIndicators[3].light.visible = false;
                                    }
                                } else {
                                    this.delegate.beatIndicators[3].light.visible = false;
                                    this.delegate.beatIndicators[2].light.visible = false;
                                }
                            } else {
                                this.delegate.beatIndicators[3].light.visible = false;
                                this.delegate.beatIndicators[2].light.visible = false;
                                this.delegate.beatIndicators[1].light.visible = false;
                            }
                        } else {
                            this.delegate.beatIndicators[3].light.visible = false;
                            this.delegate.beatIndicators[2].light.visible = false;
                            this.delegate.beatIndicators[1].light.visible = false;
                            this.delegate.beatIndicators[0].light.visible = false;
                        }
                    }
                }

                this.delegate.beatsLastCycle = beatsThisCycle;
                this.delegate.volumeThresholds = vt;
                this.delegate.volumeThresholdDecay = vtd;
                this.delegate.thresholdDecayWaits = tdw;
                this.delegate.thresholdDecayRates = tdr;
                //*/
            };

            this.javascriptNode.connect(this.context.destination);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.javascriptNode);

            this.loadSound("res/02 - Invaders Must Die (St. Vitus Dance Remix).mp3");

            this.buildBeatLights();
        }
        return basicEQ;
    })();
    eq.basicEQ = basicEQ;
})(eq || (eq = {}));
//# sourceMappingURL=basicEQ.js.map
