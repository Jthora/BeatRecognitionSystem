
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    eqDev:{},

    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();
        var size = cc.director.getWinSize();
        this.containerView = cc.LayerColor.create(cc.color(32,32,32,255), size.width, size.height);
        this.addChild(this.containerView);
        this.eqDev = new eq.basicEQ(this.containerView);

        cc.log("eventManager: ",cc.eventManager);

        cc.log("this: ",this);
        console.log("this.eqDev: ",this.eqDev);
        return true;
    },

    onEnterTransitionDidFinish: function () {
        for(var key in cc.sys.capabilities) {
            cc.log("cc.sys.capabilities[" + key + "] : " + cc.sys.capabilities[key]);
        }
        var kbListener = new cc._EventListenerKeyboard();
        kbListener.onKeyReleased = function(keyCode, event){
            if(keyCode == cc.KEY.space)
            {
                var layer = event.getCurrentTarget();
                layer.eqDev.togglePause();
            }
            else if(keyCode == cc.KEY.enter)
            {
                
            }

            
        }

        cc.log("this: ",this);
        cc.log("this.eqDev: ",this.eqDev);

        cc.log("keyboardListener: ",kbListener);
        cc.log("keyboardListener.checkAvailable(): ",kbListener.checkAvailable());

        cc.eventManager.addListener(kbListener, this);
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

document.addEventListener('keydown', function(e){
    cc.eventManager.dispatchEvent(new cc.EventKeyboard(e.keyCode,true));
});
document.addEventListener('keyup', function(e){
    cc.eventManager.dispatchEvent(new cc.EventKeyboard(e.keyCode,false));
});
