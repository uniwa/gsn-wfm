# -*- coding: utf-8 -*-

import caslib
import urllib, urllib2
import json
import time
import sys
import os

sys.path.append(os.path.join(os.path.abspath(os.path.dirname(__file__)), '../pywfm'))
from pywfm import WfmApi


class WfmFTPApi(WfmApi):
    def __init__(self, username, password, server, service):
        super(WfmFTPApi, self).__init__(username, password, server, service)


    def wfm_list(self):
        """Gets the python dictionary with the home contents and returns each \
        file/folder in an ftp appropriate format.
        """
        l = self.cmd_ls()

        for d in l['ls']['contents']:
            d = dict((k, v) for k, v in d.iteritems() if k == 'name' or k == 'length' or k == 'type')

            if d['type'] == 'file':
                perms = '-rwxrwxrwx'
            else:
                perms = 'drwxrwxrwx'
            nlinks = '1'
            uname = gname = self._username
            size = d['length']
            timefunc = time.localtime
            mtime = time.strftime("%b %d %H:%M", timefunc())
            basename = d['name']
            
            yield "%s %3s %-8s %-8s %8s %s %s\r\n" % (perms, nlinks, uname, gname,
                                                      size, mtime, basename)




# vim: ts=4 sw=4 et:
