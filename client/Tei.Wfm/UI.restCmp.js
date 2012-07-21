// JavaScript Document
Ext.apply(Tei.Wfm.App.prototype.UI,
	{
		scope : this.scope,
		
		init_ControlPanel : function(){
			
			
			var themeOptions =	new Ext.data.ArrayStore({
	        	id: 0,
		        fields: [
        		'themeSrc',
		        'themeText'
        		],
		        data: [
					   ['ext-3.3.1/resources/css/xtheme-gray.css', 'Gray'], 
					   ['ext-3.3.1/resources/css/xtheme-blue.css', 'Blue'], 
					   ['ext-3.3.1/resources/css/xtheme-slate.css', 'Slate'],
					   ['ext-3.3.1/resources/css/xtheme-access.css', 'Access']
				]
    		});
			 
			 
			var themeSelector = new Ext.form.ComboBox({
				fieldLabel: 'Theme',
				store:themeOptions,
				valueField: 'themeSrc',
				displayField: 'themeText',
				typeAhead: false,
				mode: 'local',
				triggerAction: 'all',
				selectOnFocus:true
			});
			
			themeSelector.on('select',function(ddl,rec,idx){

				Ext.util.CSS.swapStyleSheet('theme', rec.get('themeSrc'));		
				scope.cookieProvider.set('wfm-theme', rec.get('themeSrc'));

			});
			
			
			savedTheme = scope.cookieProvider.get('wfm-theme', false);
			if (savedTheme)
			themeSelector.setValue(savedTheme);
			else
			themeSelector.setValue('ext-3.3.1/resources/css/xtheme-gray.css');

			

			var formPanel =  {
		        xtype       : 'form',
        		height      : 125,
		        autoScroll  : true,
        		id          : 'formpanel',
		        defaultType : 'field',
        		frame       : true,
				bodyBorder:false,
				border: false,
				hideBorders: true,
				defaults: {
					border: false,
					hideBorders: true					
				},
		        items       : [
					themeSelector
		        ]
    		};
			
			var myWin = new Ext.Window({
				title : 'Control Panel&nbsp;<font color="red">[Beta]</font>',
		        id     : 'myWin',
        		height : 400,
		        width  : 400,
        		items  : [formPanel]
		    });
    
		    myWin.show();
		},
		
		init_Header : function() {
			
			//var name = userInfo.first + ' ' + userInfo.last;
			
			var name = scope.userInfo.name;
			
			scope.pnlHeader = new Ext.Panel({
				cls: 'header',
				autoScroll: false,
				layout: 'column',
				items: [ 
					{ cls: '', title: '', columnWidth: .30,
						items: [ {
							ref : '//box_user_canonical_name',
							id : 'box_user_canonical_name',
							xtype: 'box',
							cls: 'username',
							//html : '&nbsp;'
							html: name
						} ] 
					} ,
					{ cls: '', title: '', columnWidth: .50,
						items: [ {
							xtype: 'box',
							cls: '',
							html: '&nbsp;'
						} ]
					},
					{ cls: '', title: '', columnWidth: .20, items: [
						new sch.wfm.components.QuotaInfo( { id: 'quotaBar' } )
					] 
					}
				 ]
			});
		},
		
		init_quotaInfoChart : function(){
			scope.quotaInfoChart = new Ext.chart.PieChart({
				store : scope.quotaInfoStore,
				categoryField : 'status',
				dataField : 'total',
				data:[],
				extraStyle:
				{
					legend:
					{
						display: 'bottom',
						padding: 10,
						border:{
							color: '#CBCBCB',
							size: 1
						}
					}
	            },
				tipRenderer : function(chart, record, index, series){
					return record.data.status + " : " + scope.helperFuncs.formatSize(record.data.total);
				},
				labelRenderer : function(){
				}

				
			});
		},
		
		init_spaceIndicator : function(){

			scope.spaceQuotaIndicator = new sch.wfm.components.QuotaInfo();		
		},
		
		init_infoPanel : function(){

			
			scope.infoPanel.tpl = new Ext.XTemplate(
				'<div class="details">',
					'<tpl for=".">',
						'<center><img src="{[this.renderThumb(values.name,values.realId)]}" /></center><div class="details-info">',
						'<span>{[this.renderDocInfo(values)]}</span>',
					'</tpl>',
				'</div>',
				{
					compiled: false,
					
					renderDocInfo : function(dataInfo){
						
						
						var html = '<div class="panelHeader infoPanelGroup">File Info</div>';
						
						html += '<table cellspacing="0" cellpadding="0" border="0" class="infoPanelTable">';
						html += '<tbody>';
						
						html += '<tr class="">';
						html += '<td class="infoPanelLabel">Τύπος</td>';
						html += '<td class="infoPanelValue">'+ dataInfo.type +'</td>';
						html += '</tr>';
						
						html += '<tr class="even">';
						html += '<td class="infoPanelLabel">Όνομα</td>';
						html += '<td class="infoPanelValue">'+dataInfo.name+'</td>';
						html += '</tr>';
						
						if (dataInfo.type == 'file' || dataInfo.type == 'folder') {
							html += '<tr class="">';
							html += '<td class="infoPanelLabel">Μέγεθος</td>';
							html += '<td class="infoPanelValue">'+ scope.helperFuncs.formatSize(dataInfo.size) +'</td>';
							html += '</tr>';
						}
											
						html += '</tbody>';
						html += '</table>';
						
						if (Ext.isArray(dataInfo.users) || Ext.isArray(dataInfo.groups))
						{
							html += '<div class="panelHeader infoPanelGroup">Διαμοιρασμένο</div>';

							html += '<table cellspacing="0" cellpadding="0" border="0" class="infoPanelTable">';
							html += '<tbody>';

							html += '<tr class="">';
							html += '<td class="infoPanelLabel">Ομάδες</td>';
							html += '<td class="infoPanelValue">'+ this.renderGroups(dataInfo.groups) +'</td>';
							html += '</tr>';

							html += '<tr class="even">';
							html += '<td class="infoPanelLabel">Χρήστες</td>';
							html += '<td class="infoPanelValue">'+ this.renderUsers(dataInfo.users) +'</td>';
							html += '</tr>';
			
							html += '</tbody>';
							html += '</table>';
						}

						
						{
							html += '<div class="panelHeader infoPanelGroup">Περισσότερα</div>';

							html += '<table cellspacing="0" cellpadding="0" border="0" class="infoPanelTable">';
							html += '<tbody>';
							
							if (Ext.isArray(dataInfo.tags) && (dataInfo.type == 'file' || dataInfo.type == 'folder')) {
								html += '<tr class="">';
								html += '<td class="infoPanelLabel">Ετικέτες</td>';
								html += '<td class="infoPanelValue">'+ implode("<br/>",dataInfo.tags) +'</td>';
								html += '</tr>';
							}
			
							html += '</tbody>';
							html += '</table>';
						}

						return html;

					},
					
					renderThumb : function(doc_name,doc_id){
						
						if (scope.helperFuncs.isImage(doc_name))
							return String.format(scope.serverURL + "/cmd_get_thumbnail/?doc_id={0}",doc_id);
						else
							return "";
					},
					
					renderGroups : function(groups) {
						
						if (Ext.isArray(groups)) {
						
						var array_groupName = [];
						Ext.each(groups,function(group,index){
							
							if ( scope.groupsStore[group.group_id.toString()] != undefined )
								array_groupName.push(scope.groupsStore[group.group_id.toString()].group_name);
							else
								array_groupName.push("Undefined group with id : " + group.group_id.toString());
						});				
						
						var str_groups = implode("<br/>",array_groupName);
						
						return str_groups;
						}
						else
						return '';
					},
					
					renderUsers : function(users) {
						
						var array_usersName = [];
						Ext.each(users,function(user,index){
								array_usersName.push(user.username);							
						});				
						
						var str_users = implode("<br/>",array_usersName);
						
						return str_users;
					}

				}
			);

			scope.infoPanel.panel = new Ext.Panel({
				region:'center',
			    title: 'Πληροφορίες&nbsp;<font color="red">[Beta]</font>',
			    id: 'panelDetail',
				autoScroll: true,
				minSize: 150,
			    tpl: scope.infoPanel.tpl,
				bodyStyle: 'background-image:url("img/strip.png");'
			});
			
			scope.infoPanel.update = function(data){
				scope.infoPanel.tpl.overwrite(scope.infoPanel.panel.body, data);
			};
												
		}
	}
);
