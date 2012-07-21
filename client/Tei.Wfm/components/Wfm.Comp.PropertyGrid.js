Ext.namespace('Ext.ux.grid');
Ext.ux.grid.PropertyRecord = Ext.data.Record.create([
    {name:'name',type:'string'}, 'value', 'header', 'field'
]);

Ext.ux.grid.PropertyStore = function(grid, source){
    this.grid = grid;
    this.store = new Ext.data.Store({
        recordType : Ext.grid.PropertyRecord
    });

        this.store.loadRecords = function(o, options, success){
        if(!o || success === false){
            if(success !== false){
                this.fireEvent("load", this, [], options);
            }
            if(options.callback){
                options.callback.call(options.scope || this, [], options, false);
            }
            return;
        }

        var r = o.records, t = o.totalRecords || r.length;

        if(!options || options.add !== true){
            if(this.pruneModifiedRecords){
                this.modified = [];
            }

            for(var i = 0, len = r.length; i < len; i++){
                r[i].join(this);
            }

            if(this.snapshot){
                this.data = this.snapshot;
                delete this.snapshot;
            }

            this.data.clear();
            this.data.addAll(r);
            this.totalLength = t;
            //this.applySort();
            this.fireEvent("datachanged", this);

        }else{
            this.totalLength = Math.max(t, this.data.length+r.length);
            this.add(r);
        }

        this.fireEvent("load", this, r, options);

        if(options.callback){
            options.callback.call(options.scope || this, r, options, true);
        }
    };

    this.store.on('update', this.onUpdate,  this);
    if(source){
        this.setSource(source);
    }

    Ext.ux.grid.PropertyStore.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.grid.PropertyStore, Ext.util.Observable, {
    setSource : function(o,fields){
        this.source = o;
        this.store.removeAll();
        var data = [];

        if (fields) {
            for (var k in fields) {
                k=fields[k];
                if (typeof(k) == 'object'){
                //if (k.id && this.isEditableValue(o[k.dataIndex])) {
                    data.push(new Ext.grid.PropertyRecord({
                        name: k.dataIndex,
                        value: o[k.dataIndex],
                        header: k.header,
                        field: k
                    }, k.id));
                }
            }
        } else {
            for (var k in o) {
                if (this.isEditableValue(o[k])) {
                    data.push(new Ext.grid.PropertyRecord({
                        name: k,
                        value: o[k],
                        header: k
                    }, k));
                }
            }
        }
        this.store.loadRecords({records: data}, {}, true);
    },

    onUpdate : function(ds, record, type){
        if(type == Ext.data.Record.EDIT){
            var v = record.data['value'];
            var oldValue = record.modified['value'];
            if(this.grid.fireEvent('beforepropertychange', this.source, record.id, v, oldValue) !== false){
                this.source[record.id] = v;
                record.commit();
                this.grid.fireEvent('propertychange', this.source, record.id, v, oldValue);
            }else{
                record.reject();
            }
        }
    },

    getProperty : function(row){
       return this.store.getAt(row);
    },

    isEditableValue: function(val){
        if(Ext.isDate(val)){
            return true;
        }else if(typeof val == 'object' || typeof val == 'function'){
            return false;
        }
        return true;
    },

    setValue : function(prop, value){
        this.source[prop] = value;
        this.store.getById(prop).set('value', value);
    },

    getSource : function(){
        return this.source;
    }
});

Ext.ux.grid.PropertyColumnModel = function(grid, store){
    this.grid = grid;

    var g = Ext.grid;
    var f = Ext.form;
    this.store = store;
    
    Ext.ux.grid.PropertyColumnModel.superclass.constructor.call(this, [
        {header: grid.nameText, width:grid.nameWidth, fixed:true, sortable: true, dataIndex:'header', id: 'name', menuDisabled:true},
        {header: grid.valueText, width:grid.valueWidth, resizable:false, dataIndex: 'value', id: 'value', menuDisabled:true}
    ]);

    this.booleanEditor = new Ext.form.ComboBox({
            triggerAction : 'all',
            mode : 'local',
            valueField : 'boolValue',
            displayField : 'name',
            editable:false,
            selectOnFocus: true,
            forceSelection: true,
            store : {
                xtype : 'arraystore',
                idIndex : 0,
                fields : ['boolValue','name'],
                data : [[false,'false'],[true,'true']]
                }
    });

    this.editors = {
        'date' : new g.GridEditor(new f.DateField({selectOnFocus:true})),
        'string' : new g.GridEditor(new f.TextField({selectOnFocus:true})),
        'number' : new g.GridEditor(new f.NumberField({selectOnFocus:true, style:'text-align:left;'})),
        'boolean' : new g.GridEditor(this.booleanEditor)
    };

    this.renderCellDelegate = this.renderCell.createDelegate(this);
    this.renderPropDelegate = this.renderProp.createDelegate(this);
};

Ext.extend(Ext.ux.grid.PropertyColumnModel, Ext.grid.ColumnModel, {
    nameText : 'Name',
    valueText : 'Value',
    dateFormat : 'j/m/Y',

    renderDate : function(dateVal){
        return dateVal.dateFormat(this.dateFormat);
    },

    renderBool : function(bVal){
        return bVal ? 'true' : 'false';
    },

    isCellEditable : function(colIndex, rowIndex){
            var p = this.store.getProperty(rowIndex);
            if (p.data.field && p.data.field.editable == false) {
                    return false;
                }
        return colIndex == 1;
    },

    getRenderer : function(col){
        return col == 1 ? this.renderCellDelegate : this.renderPropDelegate;
    },

    renderProp : function(v){
        return this.getPropertyName(v);
    },

    renderCell : function(val, metadata, record, rowIndex, colIndex, store){
        if (record.data.field && typeof(record.data.field.renderer) == 'function'){
            return record.data.field.renderer.call(this, val, metadata, record, rowIndex, colIndex, store);
        }

        var rv = val;
        if(Ext.isDate(val)){
            rv = this.renderDate(val);
        }else if(typeof val == 'boolean'){
            rv = this.renderBool(val);
        }
        return Ext.util.Format.htmlEncode(rv);
    },

    getPropertyName : function(name){
        var pn = this.grid.propertyNames;
        return pn && pn[name] ? pn[name] : name;
    },

    getCellEditor : function(colIndex, rowIndex){
        var p = this.store.getProperty(rowIndex);
        var n = p.data['name'], val = p.data['value'];
        if(p.data.field && typeof(p.data.field.editor) == 'object'){
            return p.data.field.editor;
        }

        if(typeof(this.grid.customEditors) == 'function'){
            return this.grid.customEditors(n);
        }

        if(Ext.isDate(val)){
            return this.editors['date'];
        }else if(typeof val == 'number'){
            return this.editors['number'];
        }else if(typeof val == 'boolean'){
            return this.editors['boolean'];
        }else{
            return this.editors['string'];
        }
    },

    destroy : function(){
        Ext.ux.grid.PropertyColumnModel.superclass.destroy.call(this);
        for(var ed in this.editors){
            Ext.destroy(this.editors[ed]);
        }
    }
});

Ext.ux.grid.PropertyGrid = Ext.extend(Ext.grid.EditorGridPanel, {
    enableColumnMove:false,
    stripeRows:false,
    trackMouseOver: false,
    clicksToEdit:1,
    enableHdMenu : false,
    editable: true,
    nameWidth: 120,
    valueWidth: 50,
    source: {},
    autoExpandColumn: 'value',
    nameText : 'Name',
    valueText : 'Value',

    initComponent : function(){
        this.customEditors = this.customEditors || {};
        this.lastEditRow = null;
        var store = new Ext.ux.grid.PropertyStore(this);
        this.propStore = store;
        var cm = new Ext.ux.grid.PropertyColumnModel(this, store);
        store.store.sort('name', 'ASC');
        this.addEvents(
            'beforepropertychange',
            'propertychange'
        );
        this.cm = cm;
        this.ds = store.store;
        Ext.ux.grid.PropertyGrid.superclass.initComponent.call(this);

        this.selModel.on('beforecellselect', function(sm, rowIndex, colIndex){
            if(colIndex === 0){
                this.startEditing.defer(200, this, [rowIndex, 1]);
                return false;
            }
        }, this);
                if (!this.editable){
                    this.on('beforeedit', function(){return false})
                }
    },

    onRender : function(){
        Ext.ux.grid.PropertyGrid.superclass.onRender.apply(this, arguments);
        this.getGridEl().addClass('x-props-grid');
    },

    afterRender: function(){
        Ext.ux.grid.PropertyGrid.superclass.afterRender.apply(this, arguments);
        if(this.source){
            this.setSource(this.source);
        }
    },

    setSource : function(source){
        this.propStore.setSource(source,this.fields);
    },

    load : function(source){
        this.setSource(source);
    },

    loadRecord : function(record) {
        record.data && this.setSource(record.data);
    },

    getSource : function(){
        return this.propStore.getSource();
    },

    setEditable: function(rowIndex, editable) {
      var p = this.store.getProperty(rowIndex);
      if(p.data.field) p.data.field.editable = editable;
    }
});
