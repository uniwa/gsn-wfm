// JavaScript Document
var Settings = {ui_default_view: 'list',thumbnails: 0,thumbnail_size: 140};

Ext.namespace('Tei.Wfm');

Tei.Wfm.App = function()
{
	this.AppCmd = {
			'cmd_tree'  : true,
			'cmd_ls'    : true,

			'logout'    : true, 

			'addFile'   : false,
			'newFolder'             : false,

			'renameDoc' 		: false,
			'deleteDoc' 		: false,
			'copy' 			: false,
			'move' 			: false,
			'paste' 		: false,

			'newGroup'		: false,
			'deleteGroup'		: false,
			'renameGroup'		: false,

			'manageGroupUsers'      : false,

			'share' 		: false,

			'publish' 		: false,
			'unPublish' 		: false,

			'addStar'		: false,
			'removeStar'		: false,

			'newTag'		: false,
			'deleteTag'		: false,

			'setTags' 		: false,

			'zip'	 		: false,
			'unzip' 		: false,
			'view'			: false,
			'download'		: false,

			'emptyTrash'		: false,
			'restore'		: false,
                        
                        'reportcontent'         : false
	};

	scope = this;
	jsonDirTree = null;
	jsonDirContent = null;
	
	this.SWFUploader = null;
	
	this.currentLsArgs = null;
	this.curTreeNodSel = null;
	this.treeExpandedPath = null;
	this.doc_id_list = [];
	this.action4doc_id_list = null;
	this.state = {};
	this.appState = null,
	this.selectedDocs = [];
	this.currSchema = null;
	this.currDocId = null;

	this.serverURL = Config.serverURL;
        
	this.CMD.init();
	//this.CMD.initDebug();	

	gridLastSelectedRowIndex = null;
	this.filesStore = new Ext.data.JsonStore({fields: [
                                                            {name: 'containerNode'},
                                                            {name: 'id'},
                                                            {name: 'realId'},
                                                            {name: 'name'},
                                                            {name: 'size'},
                                                            {name: 'type'},
                                                            {name: 'owner'},
                                                            {name: 'global_public'},
                                                            {name: 'public'},
                                                            {name: 'tags'},
                                                            {name: 'groups'},
                                                            {name: 'users'},
                                                            {name: 'bookmarked'}
                                                            ]
                                                });

	this.groupsStore2 = new Ext.data.JsonStore({fields: [
                                                            {name: '_id'},
                                                            {name: 'group_name'}
                                                            ]
                                                    });


	this.filesStore.on('datachanged',function(){
			  var count = this.getCount();
			  Ext.get('tbtTotalFiles').update(count);
			  Ext.get('tbtTotalFilesMsg').update(count==0?Messages.folder_empty:(count==1?Messages.object_single:Messages.object_many));
			  Ext.get('tbtTotalSize').update(scope.helperFuncs.formatSize(this.sum('size')));
	});

	this.quotaInfoStore = new Ext.data.JsonStore({fields:['season','total']});

	this.viewMode = "details";
	this.tagsStore = [];
	this.groupsStore = {};	
	this.pnlHeader = null;
	this.pnlTree = null;
	this.listView = { currentView: Settings.ui_default_view };
	this.thumbView = null;
	this.filesView = null;
	this.toolBar = null;
	this.menuBar = {};	
	this.tagsSelector = null;
	this.propertyGrid = null;
	this.quotaInfoChart = {};
	this.clipboard = null;
	this.userInfo = null;
	scope.infoPanel = {};
	
	this.processManager = new Ext.evtApp.Process.Manager();
        
        this.notificationManager = new Ext.Wfm.App.NotificationManager();
        

	this.cookieProvider = new Ext.state.CookieProvider();

	
	//--- add custom events ---
	this.addEvents({
		
		'getUserInfo' : true,
		'getUserInfoComplete' : true,
		
		'createUI' : true,
		'createUIComplete' : true,

		//'loadTreeNodes' : true,
		//'loadTreeNodesComplete' : true,

		'confirmCreateFolder' : true,
		'createFolder' : true,
		'createFolderComplete' : true,
		
		'renameFile' : true,
		
		'restoreDoc' : true,
		
		'confirmEmptyTrash' : true,
		'emptyTrash' : true,
		'emptyTrashComplete' : true,
		
		'loadTagList' : true,
		'loadTagListComplete' : true,
		
		'promptCreateTag' : true,
		'createTag' : true,
		'createTagComplete' : true,
		
		'confirmDeleteTags' : true,
		'deleteTags' : true,
		'deleteTagsComplete' : true,
		
		'processApplyTags' : true,
		'applyTags' : true,
		'applyTagsComplete' : true,
		'removeTags' : true,
		
		'bookmarkDoc' : true,
		'bookmarkDocComplete' : true,

		'removeBookmarkDoc' : true,
		'removeBookmarkDocComplete' : true,

		'publish' : true,
		'publishComplete' : true,

		'zip' : true,
		'extract' : true,
		'extractComplete' : true,

		'promptCreateGroup' : true,
		'createGroup' : true,
		'createGroupComplete' : true,
		
		'loadGroups' : true,
		'loadGroupsComplete' : true,
		
		'processApplyGroups' : true,
		'applyGroups' : true,
		'applyGroupsComplete' : true,
		
		'unshareDocGroups' : true,
		'shareDocGroups' : true,
		
		'confirmDeleteGroups' : true,
		'deleteGroups' : true,
		'deleteGroupsComplete' : true,

		'reportBug': true,
                
                'loadNotifications' : true,
                'loadNotificationsComplete': true,
                
                'reportContent': true
		
	});

	// --- define custom events handlers ---
	this.on('setWorkspace', this.Events.onSetWorkspace);
	
	this.on('getUserInfo', this.Events.onGetUserInfo);
	this.on('getUserInfoComplete', this.Events.onGetUserInfoComplete);
	
	this.on('createUI', this.Events.onCreateUI);
	this.on('createUIComplete', this.Events.onCreateUIComplete);

	//this.on('loadTreeNodes', this.Events.onLoadTreeNodes);
	//this.on('loadTreeNodesComplete', this.Events.onLoadTreeNodesComplete);

	this.on('loadNotifications', this.Events.onLoadNotifications);
        this.on('loadNotificationsComplete', this.Events.onLoadNotificationsComplete);
        
        this.on('loadDirContent', this.Events.onLoadDirContent);
	this.on('loadDirContentComplete', this.Events.onLoadDirContentComplete);

	this.on('confirmCreateFolder', this.Events.onConfirmCreateFolder);
	this.on('createFolder', this.Events.onCreateFolder);
	this.on('createFolderComplete', this.Events.onCreateFolderComplete);
	
	this.on('copyFiles', this.Events.onCopyFiles);
	this.on('copyFilesComplete', this.Events.onCopyFilesComplete);

	this.on('moveFiles', this.Events.onMoveFiles);
	this.on('moveFilesComplete', this.Events.onMoveFilesComplete);

	this.on('confirmDeleteDocs', this.Events.onConfirmDeleteDocs);
	this.on('deleteDocs', this.Events.onDeleteDocs);
	this.on('deleteDocsComplete', this.Events.onDeleteDocsComplete);

	this.on('renameFile', this.Events.onRenameFile);
	this.on('restoreDoc', this.Events.onRestoreDoc);	

	this.on('confirmEmptyTrash', this.Events.onConfirmEmptyTrash);
	this.on('emptyTrash', this.Events.onEmptyTrash);
	this.on('emptyTrashComplete', this.Events.onEmptyTrashComplete);

	this.on('loadTagList', this.Events.onLoadTagList);
	this.on('loadTagListComplete', this.Events.onLoadTagListComplete);
	
	this.on('promptCreateTag', this.Events.onPromptCreateTag);
	this.on('createTag', this.Events.onCreateTag);
	this.on('createTagComplete', this.Events.onCreateTagComplete);

	this.on('confirmDeleteTags', this.Events.onConfirmDeleteTags);
	this.on('deleteTags', this.Events.onDeleteTags);
	this.on('deleteTagsComplete', this.Events.onDeleteTagsComplete);
	
	this.on('processApplyTags', this.Events.onProcessApplyTags);
	this.on('applyTags', this.Events.onApplyTags);
	this.on('removeTags', this.Events.onRemoveTags);
	this.on('applyTagsComplete', this.Events.onApplyTagsComplete);	

	this.on('bookmarkDoc', this.Events.onBookmarkDoc);
	this.on('bookmarkDocComplete', this.Events.onBookmarkDocComplete);	

	this.on('removeBookmarkDoc', this.Events.onRemoveBookmarkDoc);
	this.on('removeBookmarkDocComplete', this.Events.onRemoveBookmarkComplete);	

	this.on('publish', this.Events.onPublish);
	this.on('publishComplete', this.Events.onPublishComplete);	

	this.on('zip', this.Events.onZip);
	this.on('extract', this.Events.onExtract);
	this.on('extractComplete', this.Events.onExtractComplete);

	this.on('promptCreateGroup', this.Events.onPromptCreateGroup);
	this.on('createGroup', this.Events.onCreateGroup);
	this.on('createGroupComplete', this.Events.onCreateGroupComplete);

	this.on('loadGroups', this.Events.onLoadGroups);
	this.on('loadGroupsComplete', this.Events.onLoadGroupsComplete);
	
	this.on('processApplyGroups', this.Events.onProcessApplyGroups);
	this.on('applyGroups', this.Events.onApplyGroups);
	this.on('applyGroupsComplete', this.Events.onApplyGroupsComplete);

	this.on('unshareDocGroups', this.Events.onUnshareDocGroups);
	this.on('shareDocGroups', this.Events.onShareDocGroups);

	this.on('confirmDeleteGroups', this.Events.onConfirmDeleteGroups);
	this.on('deleteGroups', this.Events.onDeleteGroups);
	this.on('deleteGroupsComplete', this.Events.onDeleteGroupsComplete);

	this.on('reportBug', this.Events.onReportBug);
        
        this.on('reportContent', this.Events.onReportContent);

	// --- fire the first event ---
	this.fireEvent('getUserInfo',null);
	
	//this.fireEvent('createUI',null);
}

// --- Our class App inherits from class Observable so that we can define custom events ---
Ext.extend(Tei.Wfm.App,Ext.util.Observable);

var p = Tei.Wfm.App.prototype;

p.States = {};
p.Events = {};
p.UI = { scope:this.scope };
p.serverReqs = {};
p.serverHdls = {};
p.clientHdls = {};
p.helperFuncs = {};
p.schmemas = {};
p.CMD = {};
p.lang = {};