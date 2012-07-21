Ext.namespace('Ext.uEvt.AjaxReq');

Ext.uEvt.AjaxReq.TaskRec = {};

Ext.uEvt.AjaxReq.TaskRec.STATE_QUEUE = 0;
Ext.uEvt.AjaxReq.TaskRec.STATE_FINISHED = 1;
Ext.uEvt.AjaxReq.TaskRec.STATE_FAILED = 2;
Ext.uEvt.AjaxReq.TaskRec.STATE_PROCESSING = 3;

Ext.uEvt.AjaxReq.Monitor = function(config)
{
  var default_config = {
    border: false,
    width: 450,
    height: 300,
    minWidth: 450,
    minHeight: 300,
    plain: true,
    constrainHeader: true,
    draggable: true,
    closable: false,
    maximizable: false,
    minimizable: false,
    resizable: true,
    autoDestroy: true,
    windowTitle: "title",
	layout:'fit',
	loadMask:true,
	modal:true,
    // --------
    url: '',
	autoRun : false,
	
	textLayout : {

		windowTitle : Messages.win_title_process_operation,
		waitingMsg : Messages.loading_txt_process_in_queue,
		processingMsg : Messages.loading_txt_in_process,
		abortMsg : Messages.loading_txt_process_abort,
		successMsg : Messages.loading_txt_process_success,
		errorMsg : Messages.loading_txt_process_error,
		failMsg : Messages.loading_txt_process_fail,
				
		lblBtnProcess : Messages.btn_lbl_continue_processes,
		lblBtnAbort : Messages.btn_lbl_abort_processes,
		lblBtnClose : Messages.btn_lbl_close
	}	
  };
  
  config = Ext.applyIf(config || {}, default_config);
  //config.layout = 'absolute';

  Ext.uEvt.AjaxReq.Monitor.superclass.constructor.call(this, config);
};

Ext.extend(Ext.uEvt.AjaxReq.Monitor, Ext.Window, {

	store : null,

	taskRecord : null,

	state_tpl : null,

	grid_panel : null,

	grid_panel_cols : null,

	progress_bar : null,

	is_requesting : false,

  	initial_queued_count : 0,
	
	transactionId : null,
	
	initComponent : function()
  	{
    	Ext.uEvt.AjaxReq.Monitor.superclass.initComponent.call(this);
		
		this.setTitle(this.textLayout.windowTitle);
		
		this.state_tpl = new Ext.Template(
		  "<div class='ext-ajaxRequestDialog-state ext-ajaxRequestDialog-state-{state}'>&#160;</div>"
		).compile();		
		
		
		this.createTaskRecord();
		this.createTaskStore();
		this.fillTaskStore();
		this.createGrdPnlCols();
		this.createGrid();
		
		this.addEvents({
			  'ajaxReqTaskCompleteEvent': true,
			  'ajaxReqTaskFailedEvent': true,
			  'ajaxReqTaskTotalCompleteEvent':true
		});
		
		this.on('close',function(){this.destroy();},this);

		this.show.call(this);
		this.hide.call(this);
	},

	createTaskRecord : function()
	{
		var taskRecordDefaultFields = new Array({name: 'state', type: 'int'},{name: 'note'});

		var combinedTaskRecFields = new Array();

		combinedTaskRecFields = combinedTaskRecFields.concat(taskRecordDefaultFields,this.taskRecordCustomFields);

		this.taskRecord = Ext.data.Record.create(combinedTaskRecFields);
	},

	createTaskStore : function()
	{
		this.store = new Ext.data.Store({
			proxy: new Ext.data.MemoryProxy([]),
			reader: new Ext.data.JsonReader({}, this.taskRecord),
			sortInfo: {field: 'state', direction: 'DESC'},
			pruneModifiedRecords: true
		})
	},

	fillTaskStore : function()
	{
		var store = this.store;

		for (var i = 0; i < this.dataParams.length; i++) 
		{
			var tmp = new Object();
			
			for(j = 0; j < this.taskRecordCustomFields.length; j++)
			{
				tmp[this.taskRecordCustomFields[j].name.toString()] = (this.dataParams[i])[this.taskRecordCustomValues[j].toString()] || (this.dataParams[i]).get(this.taskRecordCustomValues[j].toString());
			}
			
			tmp['post_params'] = this.buildPostParams(this.dataParams[i]);
			
			tmp['state'] = Ext.uEvt.AjaxReq.TaskRec.STATE_QUEUE;
			
			tmp['note'] = this.textLayout.waitingMsg;
			
			store.add(new this.taskRecord(tmp));
		}
	},

	createGrdPnlCols : function()
	{
	
		var stateDefaultCol = new Array({
								hidden : true,
					        	header: Messages.hdr_lbl_state_process,
						        width: 70,
							    resizable: false,
					        	dataIndex: 'state',
						        sortable: true,
					    	    renderer: this.renderStateCell.createDelegate(this)
		});

		var noteDefaultCol = new Array({
								header: Messages.hdr_lbl_note_process,
								width: 150,
						        dataIndex: 'note',
					    	    sortable: true
	   	});

		var cols = new Array();

		cols = cols.concat(stateDefaultCol,this.customCols);
		cols = cols.concat(noteDefaultCol);

		this.grid_panel_cols = new Ext.grid.ColumnModel(cols);
	},
	
	renderStateCell : function(data, cell, record, row_index, column_index, store)
	{
		return this.state_tpl.apply({state: data});
	},
	
	fillToolbar : function()
	{
		var tb = this.grid_panel.getBottomToolbar();
    	tb.x_buttons = {};
		
		tb.x_buttons.process = tb.addButton({
			text: this.textLayout.lblBtnProcess,
			tooltip: this.textLayout.lblBtnProcess,
			handler: function(){
				this.beginProcess();
			},
			scope: this
		});

		tb.x_buttons.abort = tb.addButton({
			text: this.textLayout.lblBtnAbort,
			tooltip: this.textLayout.lblBtnAbort,
			handler: function(){
	
				if (this.is_requesting)
					this.abortAjaxReqTask();
			},
			scope: this
		});
		
		tb.x_buttons.close = tb.addButton({
			text: this.textLayout.lblBtnClose,
			tooltip: this.textLayout.lblBtnClose,
			handler: function(){
	
				this.hide();
			},
			scope: this
		});
		
	},
	
	createGrid : function()
	{		
		this.grid_panel = new Ext.grid.GridPanel({
			ds: this.store,
			cm: this.grid_panel_cols,
			layout:'fit',
			height: this.height-50,
			x: 0,
			y: 22,
			border: true,
			viewConfig: {
				autoFill: true,
				forceFit: true
			},
			bbar : new Ext.Toolbar()
		});

		this.grid_panel.on('render', this.onGridRender, this);

		this.grid_panel.on('viewready', this.onGridViewReady, this);		

		this.add(this.grid_panel);
	},
	
	onGridRender : function()
	{
		this.fillToolbar();
	},
	
	onGridViewReady : function()
	{
		if (this.autoRun)
			this.beginProcess();
	},

	beginProcess : function()
	{
		if (this.hasUnrequestedTasks() && !this.is_requesting)
		{
			this.grid_panel.getColumnModel().setHidden(0, false);
			this.setAjaxReqFlag();
			this.prepareNextAjaxReqTask()
		}
	},

	abortAjaxReqTask : function()
  	{
		try
		{
			Ext.Ajax.abort(this.transactionId);
			this.resetAjaxReqFlag();

			var store = this.grid_panel.getStore();
			var record = null;

			store.each(function(r) {
				if (r.get('state') == Ext.uEvt.AjaxReq.TaskRec.STATE_PROCESSING) 
				{
					record = r;
					return false;
				}
			});

			record.set('state', Ext.uEvt.AjaxReq.TaskRec.STATE_FAILED);
			record.set('note', this.textLayout.abortMsg);
			record.commit();

			if (record != null)
				this.fireEvent('ajaxReqTaskTotalCompleteEvent');
		}
		catch(ex)
		{
			//ignore exception
		}
  	},

	prepareNextAjaxReqTask : function()
	{
		if (this.is_requesting) 
		{
			//var store = this.grid_panel.getStore();
			var store = this.store;
			
			var record = null;

			store.each(function(r) {
				if (!record)
				{
					var recState = r.get('state');
						
					if (recState == Ext.uEvt.AjaxReq.TaskRec.STATE_QUEUE)
					{
						record = r;
					}
				}
			});

			record.set('state', Ext.uEvt.AjaxReq.TaskRec.STATE_PROCESSING);
			record.set('note', this.textLayout.processingMsg);
			record.commit();

			this.ajaxReqTask(record);
		}
  	},
	
	ajaxReqTask : function(record)
  	{	
		this.transactionId = Ext.Ajax.request({
			url : this.url,
			params : record.get('post_params'),
			method : 'POST',
			success : this.onAjaxSuccess,
			failure : this.onAjaxFailure,
			record: record,
			scope:this
		});
	},

	onAjaxSuccess : function(response, options)
  	{
		var json_response = Ext.decode(response.responseText);
		
		var data = {
			record: options.record,
			response: json_response
		};
		
		if (json_response.success)
		{
			this.fireEvent('ajaxReqTaskCompleteEvent',data);
		}
		else
		{
			data.msg = '';
			if ( json_response.status_msg ) {
				var msg = 'ret_' + json_response.status_msg;
				if ( Messages[ msg ] ) data.msg = Messages[ msg ];
				else data.msg = json_response.status_msg;
			}
			this.fireEvent('ajaxReqTaskFailedEvent',data);
		}

		this.updateRecordState(data);
		
		if (this.hasUnrequestedTasks())
			this.prepareNextAjaxReqTask();
		else
		{
			this.resetAjaxReqFlag();
			this.fireEvent('ajaxReqTaskTotalCompleteEvent');
		}
	},

    onAjaxFailure : function(response, options)
	{
		var data = {
			record : options.record,
			response : {
				'success' : false,
				'fail_msg' : this.textLayout.failMsg
			}
		};
		
		this.updateRecordState(data);
		
		if (this.hasUnrequestedTasks())
			this.prepareNextAjaxReqTask();
		else
		{
			this.resetAjaxReqFlag();
			this.fireEvent('ajaxReqTaskTotalCompleteEvent');
		}
	},

	updateRecordState : function(data)
	{
		if (data.response.success) 
		{
			data.record.set('state', Ext.uEvt.AjaxReq.TaskRec.STATE_FINISHED);
			data.record.set('note', this.textLayout.successMsg || data.response.status_msg);
		}
		else 
		{
			data.record.set('state', Ext.uEvt.AjaxReq.TaskRec.STATE_FAILED);
			data.record.set('note', data.response.fail_msg || this.textLayout.errorMsg + "["+data.response.status_msg+"]" );
		}

		data.record.commit();
	},
	
	getQueuedCount : function(count_processing)
	{
		var count = 0;
		//var store = this.grid_panel.getStore();
		var store = this.store;

		store.each(function(r) {
			
			var recState = r.get('state');

			if (recState == Ext.uEvt.AjaxReq.TaskRec.STATE_QUEUE) 
			{
				count++;
			}
    	});

		return count;
	},
	
	hasUnrequestedTasks : function()
	{
		return this.getQueuedCount() > 0;
	},
	
	setAjaxReqFlag : function()
	{
		this.is_requesting = true;
	},
	
	resetAjaxReqFlag : function()
	{
		this.is_requesting = false;
	}
});
