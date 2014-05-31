///<reference path="./basicEQ.d.ts"/>
///<reference path="./cocos2d.d.ts"/>

module eq
{

	export class basicEQ 
	{
	    
		public context:any;
		public audioBuffer:any;
		public sourceNode:any;
		public analyser:any;
		public javascriptNode:any;
		public gradient:any;
		public containerView:any;

		public volumeThresholds:any[];
		public volumeThresholdDecay:any[];
		public thresholdDecayWaits:any[];
		public thresholdDecayRates:any[];
		public beatHoldTimes:any[];
		public beatsLastCycle:number;

		public beatSprites:any[];

		public firstRun:boolean;
		public cycles:number;

		public paused:boolean;
		public startOffset:number;
		public startTime:number;

		public beatIndicators:any[];

	    constructor(containerView:any) 
	    {
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
	    	this.javascriptNode.onaudioprocess = function() {

	    		//*
	    		var array = new Uint8Array(this.delegate.analyser.frequencyBinCount);
	    		this.delegate.analyser.getByteFrequencyData(array);
	    		var average = this.delegate.getAverageVolume(array);
	    		
	    		if(this.delegate.firstRun)
	    		{
	    			this.delegate.volumeThresholds = Array.apply( [], array);
	    			for(var i = 0; i < array.length; i++)
	    			{
		    			this.delegate.volumeThresholdDecay[i] = 0;		// Current Decay Level
		    			this.delegate.thresholdDecayWaits[i] = 1;  	// Cycles Until Decay Begins
		    			this.delegate.thresholdDecayRates[i] = 0.1;	// Multiplier for Decay
	    			}
	    			this.delegate.firstRun = false;
	    		}

	    		var cycle = this.delegate.cycles;
	    		cycle++;

	    		var vt = this.delegate.volumeThresholds;
	    		var vtd = this.delegate.volumeThresholdDecay;
	    		var tdw = this.delegate.thresholdDecayWaits;
	    		var tdr = this.delegate.thresholdDecayRates;

	    		var beatsThisCycle:number = 0;
	    		if(!this.delegate.paused)
	    		{
		    		for(var i = 0; i < array.length; i++)
		    		{
		    			if(vt[i] < array[i]) // Beat Detected
		    			{
		    				beatsThisCycle++;
		    				vt[i] = array[i];
		    				vtd[i] = 0;
		    				this.delegate.hitBeat(i);
		    			}
		    			else // Beat Not Detected - Perform Decay
		    			{
		    				vtd[i]++;
		    				if(vtd[i] > tdw[i])
		    				{
		    					vt[i] *= tdr[i];
		    					this.delegate.cullBeat(i);
		    				}
		    			}
		    			if(beatsThisCycle > array.length / 5)
			    		{
			    			this.delegate.beatIndicators[0].light.visible = true;
			    			if(beatsThisCycle > array.length / 4)
			    			{
			    				this.delegate.beatIndicators[1].light.visible = true;
								if(beatsThisCycle > array.length / 3)
					    		{
					    			this.delegate.beatIndicators[2].light.visible = true;
					    			if(beatsThisCycle > array.length / 2)
					    			{
					    				this.delegate.beatIndicators[3].light.visible = true;
					    			}
					    			else
					    			{
					    				this.delegate.beatIndicators[3].light.visible = false;
					    			}
					    		}
				    			else
				    			{
				    				this.delegate.beatIndicators[3].light.visible = false;
				    				this.delegate.beatIndicators[2].light.visible = false;
				    			}
			    			}
			    			else
			    			{
			    				this.delegate.beatIndicators[3].light.visible = false;
			    				this.delegate.beatIndicators[2].light.visible = false;
			    				this.delegate.beatIndicators[1].light.visible = false;
			    			}
			    		}
		    			else
		    			{
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
	    	}

	    	this.javascriptNode.connect(this.context.destination);
	        this.sourceNode.connect(this.analyser);
	        this.analyser.connect(this.javascriptNode);

	    	this.loadSound("res/02 - Invaders Must Die (St. Vitus Dance Remix).mp3");

	    	this.buildBeatLights();
	    }

	    public togglePause = () : void =>
	    {
	    	if(this.paused)
	    	{
	    		this.play();
	    		this.paused = false;
	    	}
	    	else
	    	{
	    		this.pause();
	    		this.paused = true;
	    	}
	    }

	    public pause = () : void =>
	    {
	    	this.sourceNode.stop();
	    	this.startOffset = this.context.currentTime - this.startTime;
	    }

	    public play = () : void =>
	    {
	    	this.startTime = this.context.currentTime;
	    	this.sourceNode = this.context.createBufferSource();

	    	this.sourceNode.buffer = this.audioBuffer;
	    	this.sourceNode.loop = true;
	    	this.sourceNode.connect(this.context.destination);
	        this.sourceNode.connect(this.analyser);
	    	this.sourceNode.start(0, this.startOffset % this.audioBuffer.duration);
	    }

	    public buildBeatLights = () : void => 
	    {
	    	for(var i = 0; i < 4; i++)
	    	{
	    		var indicator:any = cc.Sprite.create("res/beat_indicator_bg.png",cc.rect(0,0,80,80),false);
		    	indicator.setPosition(1300,2000-(i*100));
		    	var light:any;
		    	switch(i)
		    	{
		    		default:
		    		case 0:
		    			light = cc.Sprite.create("res/beat_indicator_light_blue.png",cc.rect(0,0,80,80),false);
		    			break;
		    		case 1:
		    			light = cc.Sprite.create("res/beat_indicator_light_orange.png",cc.rect(0,0,80,80),false);
		    			break;
		    		case 2:
		    			light = cc.Sprite.create("res/beat_indicator_light_green.png",cc.rect(0,0,80,80),false);
		    			break;
		    		case 3:
		    			light = cc.Sprite.create("res/beat_indicator_light_hotpink.png",cc.rect(0,0,80,80),false);
		    			break;

		    	}
		    	light.setPosition(40,40);
		    	indicator.light = light;
		    	indicator.addChild(light);
		    	this.beatIndicators[i] = indicator;
		    	this.beatIndicators[i].light.visible = false;
		    	this.containerView.addChild(this.beatIndicators[i]);
	    	}
	    }

	    public Uint8ArrayToJSArray = (uint8array:Uint8Array) : any[] => {

	    	return 
	    }

	    public setupAudioNodes = () : void => {
	    	this.sourceNode = this.context.createBufferSource();
	    	// and connect to destination
	    	this.sourceNode.connect(this.context.destination);
	    }

	    public getGradient = () : void => {
	    	var gradient = this.context.createLinearGradient(0,0,0,300);
	    	gradient.addColorStop(1, '#000000');
	    	gradient.addColorStop(0.75, '#ff0000');
	    	gradient.addColorStop(0.25, '#ffff00');
	    	gradient.addColorStop(0, '#ffffff');
	    	return gradient;
	    }

	    public getAverageVolume = (array:any[]) : void => {
	    	var values = 0;
	    	var average;
	    	var length = array.length;

	    	// get all the frequency amplitudes
	    	for(var i = 0; i < length; i++)
	    	{
	    		values += array[i];
	    	}

	    	average = values / length;
	    	return average;
	    }

	    public playSound = () : void => {
	    	//console.log("this.sourceNode: ",this.sourceNode);
	    	this.sourceNode.buffer = this.audioBuffer;
	    	this.sourceNode.loop = true;
	    	this.sourceNode.start(0);
	    }

	    public onError = (e:any) : void => {
	    	console.log(e);
	    }

	    public loadSound = (url:any) : void => {
	    	var request:any = new XMLHttpRequest();
	    	request.open('GET', url, true);
	    	request.responseType = 'arraybuffer';
	    	request.delegate = this;

	    	// When loaded decode the data
	    	request.onload = function() {
	    		//decode the data
	    		this.delegate.context.decodeAudioData(request.response, function(buffer){
	    			request.delegate.audioBuffer = buffer;
	    			request.delegate.playSound();
	    			}, request.delegate.onError);
	    	}
	    	request.send();
	    }

	    public hitBeat = (channel:number) : void => {
	    	if(this.beatSprites[channel] == null)
	    	{
	    		var s:any;
	    		if(channel % 2 == 0)
	    			s = cc.Sprite.create("res/bar_blue_bright.png",cc.rect(0,0,40,2),false);
	    		else
	    			s = cc.Sprite.create("res/bar_orange_bright.png",cc.rect(0,0,40,2),false);
	    		this.beatSprites[channel] = s;
	    		this.beatSprites[channel].setPosition(700,(channel*4)+150);
	    		this.containerView.addChild(this.beatSprites[channel]);
	    	}
	    	else
	    	{
	    		if(channel % 2 == 0)
	    		{
	    			this.beatSprites[channel].setTexture("res/bar_blue_bright.png");
	    		}
	    		else
	    		{
	    			this.beatSprites[channel].setTexture("res/bar_orange_bright.png");
	    		}
	    	}
	    	this.beatSprites[channel].isHit = true;
	    	this.beatSprites[channel].setScaleX(25*(this.volumeThresholds[channel]/256));
	    }
	    public cullBeat = (channel:number) : void => {
	    	if(this.beatSprites[channel] == null)
	    	{
	    		var s:any;
	    		if(channel % 2 == 0)
	    			s = cc.Sprite.create("res/bar_blue.png",cc.rect(0,0,40,2),false);
	    		else
	    			s = cc.Sprite.create("res/bar_orange.png",cc.rect(0,0,40,2),false);
	    		this.beatSprites[channel] = s;
	    		this.beatSprites[channel].setPosition(700,(channel*4)+150);
	    		this.containerView.addChild(this.beatSprites[channel]);
	    	}
	    	if(this.beatSprites[channel].getScaleX() >= 0.01)
	    	{
	    		this.beatSprites[channel].setScaleX(this.beatSprites[channel].getScaleX()*0.95);
	    	}
	    	if(this.beatSprites[channel].isHit == true)
	    	{
	    		this.beatSprites[channel].isHit = false;
	    		if(channel % 2 == 0)
	    		{
	    			this.beatSprites[channel].setTexture("res/bar_blue.png");
	    		}
	    		else
	    		{
	    			this.beatSprites[channel].setTexture("res/bar_orange.png");
	    		}
	    	}
	    }
	}
}








