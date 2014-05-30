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

		public beatSprites:any[];

		public firstRun:boolean;
		public cycles:number;

	    constructor(containerView:any) 
	    {
	    	this.containerView = containerView;

	    	this.firstRun = true;

	    	this.volumeThresholds = [];
	    	this.volumeThresholdDecay = [];
	    	this.thresholdDecayWaits = [];
	    	this.thresholdDecayRates = [];
	    	this.beatHoldTimes = [];

	    	this.beatSprites = [];

	    	this.cycles = 0;

	    	this.context = new webkitAudioContext();
	    	this.setupAudioNodes();

	    	this.analyser = this.context.createAnalyser();
	    	this.analyser.smoothingTimeConstant = 0.3;
	    	this.analyser.fftSize = 1024;


	    	console.log(this.containerView);
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

	    		for(var i = 0; i < array.length; i++)
	    		{
	    			if(vt[i] < array[i]) // Beat Detected
	    			{
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
	    			
	    		}

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

	    public playSound = (buffer:any) : void => {
	    	console.log("this.sourceNode: ",this.sourceNode);
	    	this.sourceNode.buffer = buffer;
	    	this.sourceNode.start();
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
	    			request.delegate.playSound(buffer);
	    			}, request.delegate.onError);
	    	}
	    	request.send();
	    }

	    public hitBeat = (channel:number) : void => {
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
	    	if(this.beatSprites[channel].getScaleX() > 0.01)
	    		this.beatSprites[channel].setScaleX(this.beatSprites[channel].getScaleX()*0.95);
	    }
	}
}








