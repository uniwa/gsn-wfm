#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import sys
from pyftpdlib import ftpserver
from wfmhandlers import WfmFTPHandler, WfmFTPAuth

def main():
    authorizer = WfmFTPAuth()
    handler = WfmFTPHandler
    handler.authorizer = authorizer
    server = ftpserver.FTPServer(('', 2121), handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
    
# vim: ts=4 sw=4 et:
