# -*- coding: utf-8 -*-

from pyftpdlib import ftpserver

import sys
from wfmftpapi import WfmFTPApi

CAS_SERVER = 'https://sso.sch.gr'
CAS_SERVICE = 'http://wfm.edu.teiath.gr'



class WfmFTPAuth(ftpserver.DummyAuthorizer):
    def __init__(self):
        self.user_table = {}
        self.users = {}


    def validate_authentication(self, username, password):
        """Authencate from ldap and on success add user to ftp user list."""
        wfm_user = WfmFTPApi(username, password, CAS_SERVER, CAS_SERVICE)
        print "CAS => Authenticating..this may take a moment..." # debug
        
        wfm_user.cas_login()
        
        if not wfm_user.is_authenticated():
            print "ERROR => could not authenticate user in CAS" # debug
            return False

        # intialize the wfm web app
        if not wfm_user.wfm_init_calls():
            print "ERROR => could make initial calls to wfm"
            return false
        else:
            print "OK => wfm initial call"
        
        if username not in self.user_table:
            self.add_user(username, password, '.', perm='elradfmw')

        # store the object - only with this we can make calls through wfm api
        if username not in self.users:
            self.users[username] = wfm_user

        return True


    def _del_user(self, username):
        """Remove user from self.user_table dict."""
        try:
            del(self.user_table[username])
            del(self.users[username])
        except KeyError:
            pass



class WfmFTPHandler(ftpserver.FTPHandler):


    def ftp_LIST(self, path):
        print "=> LIST: my custom handler"

        # fetch files and foldres from user home
        iterator = self.authorizer.users[self.username].wfm_list()
        producer = ftpserver.BufferedIteratorProducer(iterator)

        self.push_dtp_data(producer, isproducer=True, cmd="LIST")


    def on_logout(self, username):
        self.authorizer._del_user(username)


# vim: ts=4 sw=4 et:
