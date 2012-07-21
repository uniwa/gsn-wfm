Ext.namespace('Ext.ux.MyUtils');

Ext.ux.MyUtils.RequestQueue = function(){

	this.queue = [];
	this.warnings = [];
	this.successful = [];
	
	this.is_processing = false;

	this.postRequest = function(reqCnfs)
	{
		this.queue.push(reqCnfs);
	}

	this.flushRequestQueue = function()
	{
		this.queue = [];
	}

	this.proccess = function(scope)
	{

		if (this.queue.length > 0) 
		{
			var reqCnfs = this.queue.shift();
			reqCnfs.action.call(scope, reqCnfs.reqConfs);
		}
	}	
}