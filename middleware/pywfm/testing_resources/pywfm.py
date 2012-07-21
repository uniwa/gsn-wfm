# -*- coding: utf-8 -*-

import caslib
import urllib
import urllib2
import MultipartPostHandler
#from poster.encode import multipart_encode
#from poster.streaminghttp import register_openers
import json
import time

def execute_command(f):
    """Decorator that sends a request to the server
    to execute the api function. The wrapped function's
    name will be used to form the url to send the
    request. Finally, it renders the response to python 
    dictionary.
    
    The wrapped function must return a dictionary
    containing the data that will be used in the 
    request.
    """
    def wrapper(self, *args, **kwargs):
        url = '%s/%s/' % (self._wfm_url, f.__name__)
        data = f(self, *args, **kwargs)
        try:
            if data is not None:
                enc_data = urllib.urlencode(data)
                response = self._url_obj.open(url, enc_data)
            else:
                response = self._url_obj.open(url)
        except (AttributeError, urllib2.HTTPError):
            return False
        # json 2 python dict
        return json.loads(response.read())
    
    return wrapper


class WfmApi(object):
    def __init__(self, username, password, server, service):
        self._username = username
        self._password = password
        self._server = caslib.CASServer(server)
        self._service = caslib.CASService(service)

        self._file_obj = None
        self._url_obj = None
        self._cas_ticket = None
        self._wfm_url = '%s/server' % service

        self._wfm_home_id = None


    #--[ wfm CAS calls ]--------------------------------------------------------


    def get_service_url(self):
        """Returns the application url."""
        return self._service.url


    def get_login_url(self, renew=False):
        """Returns the cas login url.
        
        It takes the renew optional argument, if is test to true will add
        the &renew=true request. This is False by default
        """
        return self._server.login(self._service, renew=renew)


    def cas_login(self):
        """Login to CAS using the supplied username/password.
        
        Returns :
        file_obj - a file handle with the result
        url_obj: urllib2 opener with cookiejar
        """
        self._file_obj, self._url_obj = caslib.login_to_cas_service(
                                                self.get_login_url(),
                                                self._username,
                                                self._password)
        # add handler for POST requests (used by cmd_create_file)
        self._url_obj.add_handler(MultipartPostHandler.MultipartPostHandler())
        # set the cas ticket for quick access
        self._set_ticket()


    def cas_renew(self):
        """Renew CAS login.
        
        Returns :
        file_obj - a file handle with the result
        url_obj: urllib2 opener with cookiejar
        """
        self._file_obj, self._url_obj = caslib.login_to_cas_service(
                                                self.get_login_url(renew=True),
                                                self._username,
                                                self._password)
        # add handler for POST requests (used by cmd_create_file)
        self._url_obj.add_handler(MultipartPostHandler.MultipartPostHandler())
        # with renew the ticket changed, update it
        self._set_ticket()


    def get_ticket(self):
        return self._cas_ticket


    def _set_ticket(self):
        if self._file_obj is None:
            self._cas_ticket = None
            return

        try:
            ticket =  self._file_obj.__dict__['url']
        except KeyError:
            self._cas_ticket = None

        self._cas_ticket = ticket.split('=')[1]


    def is_authenticated(self):
        """Check if user is authenticated.

        Calls cas_renew() to renew the login
        """
        try:
            user = self._server.validate(self._service, self._cas_ticket)
        except caslib.InvalidTicketError:
            self._cas_ticket = None
            return False

        # renew the login
        self.cas_renew()

        return user == self._username


    #--[ wfm web api calls ]----------------------------------------------------


    def wfm_init_calls(self):
        """Initialize the connection with wfm, call aprorpiate web api functions
        """

        # call wfm init function
        url = '%s/accounts/login/' % self._wfm_url
        data = {'next': '/server/init/', 'ticket': self._cas_ticket }
        enc_data = urllib.urlencode(data)

        try:
            self._url_obj.open(url, enc_data)
        except (AttributeError, urllib2.HTTPError):
            return False

        # call cmd_tree function to get the home id
        url = '%s/cmd_tree' % self._wfm_url

        try:
            response = self._url_obj.open(url)
        except (AttributeError, urllib2.HTTPError):
            return False

        # extract home id from json and store it
        resp_dict = json.loads(response.read())
        try:
            self._wfm_home_id = resp_dict['tree']['children'][0]['node']['_id']
        except KeyError:
            return False

        return True


    @execute_command
    def cmd_ls(self):
        """List the documents of this account.
        """
        return {'group_id': '', 'path': 'root/home', 'doc_id': self._wfm_home_id }


    @execute_command
    def cmd_create_folder(self, name, parent_id=None):
        """Create a folder. If the parent_id is None
        the folder will be created under folder 'home'.
        """
        if parent_id is None:
            parent_id = self._wfm_home_id

        return {'parent_id': parent_id, 'name': name }


    @execute_command
    def cmd_tree(self):
        """Build the contents of the user's account.
        """
        return None

 
    @execute_command
    def cmd_delete(self, doc_id_list, perm='0'):
        """Delete the documents in 'doc_id_list'.
        'doc_id_list' must be a string of doc_ids separated
        by '/'. If perm == 0 then the document will be moved
        to trash folder. If perm == 1 the document will be 
        permanently deleted.
        """
        return {'doc_id_list': doc_id_list, 'perm': perm }


    def cmd_create_file(self, f, parent_id=None):
        """Uploads the given file under parent_id. If
        parent_id is not a folder, an error will be
        returned. If parent_id is None the file will
        be uploaded under home folder.
        """
        url = '%s/%s/' % (self._wfm_url, 'cmd_create_file')
        if parent_id is None:
            parent_id = self._wfm_home_id

        data = {'file_data' : open(f, 'rb'), 'parent_id' : parent_id, 'action' : 'upload'}
        try: 
            response = self._url_obj.open(url, data)
        except (AttributeError, urllib2.HTTPError), e:
            return False
        # json 2 python dict
        return json.loads(response.read())


    @execute_command
    def cmd_get_groups(self):
        """List the user's groups.
        """
        return None


    @execute_command
    def cmd_get_group_users(self, group_id):
        """List the users in the 'group_id' group
        """
        return {'group_id': group_id }


    @execute_command
    def cmd_get_userinfo(self):

        return None


    @execute_command
    def cmd_get_space(self):

        return None


    @execute_command
    def cmd_get_tag_list(self):
        """List the tags of this user.
        """
        return None


    @execute_command
    def cmd_get_bookmarks_doc(self):
        """Get the bookmarks document of this user
        """
        return None


    @execute_command
    def cmd_get_bookmarks_user(self):

        return None


    @execute_command
    def cmd_get_db_student_info(self):

        return None


    @execute_command
    def cmd_search_users(self, name, search_type='uid'):
        """search users in ldap with username o real name
        
        stype can be : 'uid' (user id) or 'cn' (canonical name)
        """

        return {'stype': search_type, 'name': name }


    @execute_command
    def cmd_rename(self, doc_id, name):
        """Rename the 'doc_id' document.
        """
        return {'doc_id': doc_id, 'name': name }

        
    @execute_command
    def cmd_zip_files(self, doc_id_list, name):
        """Zip all files in doc_id_list and save as name.zip.
        'doc_id_list' must be a string which contains all the
        document ids separated by '/'.
        """

        return {'doc_id_list': doc_id_list, 'name': name }


    @execute_command
    def cmd_add_tags(self, tag_list):
        """Create tags - do not associate them with any documents"""

        return {'tag_list': tag_list }


    @execute_command
    def cmd_delete_tags(self, tag_list):
        """Delete tags - will also remove them
        from the respective documents."""

        return {'tag_list' : tag_list}


    @execute_command
    def cmd_calculate_size(self, doc_id):

        return {'doc_id': doc_id}


    @execute_command
    def cmd_copy(self, source, destination):
        
        return {'doc_id': source, 'dest_id': destination}


    @execute_command
    def cmd_create_group(self, name):
        """Create a group."""
        return  {'group_name': name}
        

    def cmd_delete_group(self, group_id):
        """delete group"""
        command = 'cmd_group_delete'    #fix 'cmd_delete_group'
        url = '%s/%s/' % (self._wfm_url, command)

        data = {'group_id': group_id}
        enc_data = urllib.urlencode(data)
    
        try:
            response = self._url_obj.open(url, enc_data)
        except (AttributeError, urllib2.HTTPError):
            return False
    
        # json 2 python dictionary
        resp_dict = json.loads(response.read())
        return resp_dict
        

    @execute_command
    def cmd_add_to_group(self, group_id, user_list):
        """Add the users in user_list to group_id group.
        user_list must be a string of user's usernames
        separated by '/'.
        """
        return {'group_id' : group_id, 'user_list' : user_list}


    @execute_command
    def cmd_empty_trash(self):

        return None


    @execute_command
    def cmd_get_group_membership(self):
        """List the groups that this user is a member.
        """
        return None


    @execute_command
    def cmd_get_tags(self, doc_id):
        """Returns a list with the tags that have
        been attached to the 'doc_id' document.
        """

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_group_rename(self, group_id, group_name):
        """Rename the group with the given id to the given name
        """
        return {'group_id' : group_id, 'group_name' : group_name}


    @execute_command
    def cmd_include_group(self, group_id, subgroup_id):
        """Include a group to another. 
        This operation will *not* delete the included group.
        """
        return {'group_id' : group_id, 'subgroup_id' : subgroup_id}


    @execute_command
    def cmd_move(self, doc_id, dest_id):

        return {'doc_id' : doc_id, 'dest_id' : dest_id}


    @execute_command
    def cmd_set_bookmark_doc(self, doc_id):
        """Bookmarks the document.
        """
        
        return {'doc_id' : doc_id}


    @execute_command
    def cmd_remove_bookmark_doc(self, doc_id):
        """Unbookmarks the document.
        """
        # needs testing
        return {'doc_id' : doc_id}


    @execute_command
    def cmd_remove_from_group(self, group_id, user_list):
        """Removes the users listed in user_list from the group.
        user_list must be a string of usernames separated
        by '/'.
        """
        return {'group_id' : group_id, 'user_list' : user_list}


    @execute_command
    def cmd_set_tags(self, doc_id, tag_list):
        """Attach the tags that 'tag_list' contains on
        the 'doc_id' document. 'tag_list' must be a string
        with the tag names separated by '/'.
        """
        return {'doc_id' : doc_id, 'tag_list' : tag_list}


    @execute_command
    def cmd_remove_tags(self, doc_id, tag_list):
        """Remove the attached tags that 'tag_list' contains
        from the 'doc_id' document. 'tag_list' must be a 
        string with the tag names separated by '/'.
        """
        return {'doc_id' : doc_id, 'tag_list' : tag_list}


    @execute_command
    def cmd_restore(self, doc_id):

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_set_global(self, doc_id_list, glob):
        """Set the documents in the list downloadable
        (or not) given the appropriate URL. 
        doc_id_list must be a string of document ids 
        separated by '/'.
        Setting glob to '1' will set the documents as
        global. Setting glob to '0' does the opposite.
        """

        return {'doc_id_list' : doc_id_list, 'glob' : glob}


    @execute_command
    def cmd_share_doc_user(self, doc_id, user):
        """Share doc_id document with user."""

        return {'doc_id' : doc_id, 'user' : user}


    @execute_command
    def cmd_unshare_doc_user(self, doc_id, user):
        """Unshare doc_id document with user."""

        return {'doc_id' : doc_id, 'user' : user}


    @execute_command
    def cmd_share_doc_group(self, doc_id, group_id):
        """Share doc_id document with group_id group."""
        
        return {'doc_id' : doc_id, 'group_id' : group_id}


    @execute_command
    def cmd_unshare_doc_group(self, doc_id, group_id):
        """Unshare doc_id document with group_id group."""

        return {'doc_id' : doc_id, 'group_id' : group_id}


    @execute_command
    def cmd_get_image_size(self, doc_id):
        """Return the size of an image."""

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_get_thumbnail(self, doc_id):

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_get_thumb_size(self, doc_id):
        """Return the size of thumbnail."""

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_extract(self, doc_id):
        """Extract archive in server - heavy operation."""

        return {'doc_id' : doc_id}


    @execute_command
    def cmd_unflag_reported_content(self, doc_id_list):
        """Admin only operation.
        doc_id_list must be a string of document ids
        separated by '/'.
        """
        
        return {'doc_id_list' : doc_id_list}


# vim: ts=4 sw=4 sts=4 et:
