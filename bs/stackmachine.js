function operation(opecode, operand) {
	this.opecode = opecode;
	this.operand = operand;
}
operation.stop = new operation("stop", null);
function stackmachine() {
	this.counter = 0;
	this.phase = 3;
	this.stop = "No";
	this.memsize = 10;
	this.memory = [];
	this.stack = [];
	this.onConsoleout = function(output) {};
	this.onPeek = function(sender, address) {};
	this.onPoke = function(sender, address) {};
	this.onShiftPhase = function(sender, phase) {};
	this.onSetOpecode = function(sender, opecode) {};
	this.onExec = function(sender, operation) {};
	this.onSetCounter = function(sender, counter) {};
	this.onPush = function(sender, operand) {};
	this.onPop = function(sender, operand) {};
	this.onSetStop = function(sender, stop) {};
	this.validMemacc = function(address) {
		if (0 <= address && address < this.memsize) { return; }
		throw new Error("accessed out of memory.");
	};
	this.peek = function(address) {
		this.validMemacc(address);
		this.onPeek(this, address);
		return this.memory[address];
	};
	this.poke = function(address, data) {
		this.validMemacc(address);
		this.memory[address] = data;
		this.onPoke(this, address);
	};
	this.reset = function() {
		this.setStop("No");
		this.phase = 2;
		this.shiftPhase();
		this.setOpecode("ready");
		this.setCounter(0);
		this.phase = 0;
		var i;
		for (i = 0; i < this.memsize; ++i) {
			this.poke(i, operation.stop);
		}
		while (0 < this.stack.length) {
			this.pop();
		}
	};
	this.tick = function() {
		if ("Yes" === this.stop) { return; }
		try {
			var ph = this.shiftPhase();
			if ("fetch" 		=== ph) { this.fetch(); }
			else if("exec" 		=== ph) { this.execute(); }
			else if("increment" === ph) { this.increment(); }
			return true;
		} catch (e) {
			this.setStop("Yes");
			this.onConsoleout(e.message);
		}
		return false;
	};
	this.shiftPhase = function() {
		var ph = ["fetch", "exec", "increment"][this.phase];
		this.phase = (this.phase + 1) % 3;
		this.onShiftPhase(this, ph);
		return ph;
	};
	this.fetch = function() {
		var ope = this.peek(this.counter);
		this.setOpecode(ope.opecode);
	};
	this.setOpecode = function(opecode) {
		this.opecode = opecode;
		this.onSetOpecode(this, opecode);
	};
	this.execute = function() {
		if ("push" === this.opecode) {
			var ope = this.peek(this.counter);
			this.push(ope.operand);
			return;
		}
		if ("add" === this.opecode) {
			var operand1 = this.pop();
			var operand2 = this.pop();
			var v = parseInt(operand1) + parseInt(operand2);
			this.push(v.toString());
			return;
		}
		if ("print" === this.opecode) {
			var operand1 = this.pop();
			this.onConsoleout(operand1);
			return;
		}
		if ("stop" === this.opecode) {
			this.setStop("Yes");
			return;
		}
	};
	this.increment = function(count) {
		this.setCounter(this.counter + 1);
	};
	this.setCounter = function(count){
		this.counter = count;
		this.onSetCounter(this, count);
	};
	this.push = function(operand) {
		this.stack.push(operand);
		this.onPush(this, operand);
	};
	this.pop = function() {
		if (0 >= this.stack.length) {
			throw new Error("Stack under-flow");
		}
		var operand = this.stack.pop();
		this.onPop(this);
		return operand;
	};
	this.setStop = function(yesno) {
		this.stop = yesno;
		this.onSetStop(this, yesno);
	}
	this.removeEmptyString = function(stringlist) {
		var newlist = [];
		var i;
		for(i = 0; i < stringlist.length; ++i) {
			var ln = $.trim(stringlist[i]);
			if("" === ln) { continue; }
			newlist.push(ln);
		}
		return newlist;
	};
	this.loadToMemory = function(srctext) {
		var inputs = this.removeEmptyString(srctext.split(/(\r\n|\r|\n)/g));
		if(0 == inputs.length) {
			this.onConsoleout("no inputs to load to memory.");
			return true;
		}
		try {
			var i;
			for(i = 0; i < inputs.length; ++i) {
				var ln = inputs[i];
				var opes = this.removeEmptyString(ln.split(/\s+/g));
				opes.push(null);
				var ope = new operation(opes[0], opes[1]);
				this.poke(i, ope);
			}
			this.onConsoleout(inputs.length.toString() + " step(s) are loaded to memory.");
			return true;
		} catch(e) {
			this.onConsoleout(e.message);
		}
		return false;
	};
	this.reset();
}
