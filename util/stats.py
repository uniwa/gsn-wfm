#!/usr/bin/env python

import pymongo
from pymongo import Connection

db = Connection().database

# use db.collection_names() to view collections

#
# get stats for mongodb: 
#

# users
users = db.user_fs.count()

# files
files = db.fs.files.find( {'type': 'file'} ).count()

# folders
folders = db.fs.files.find( {'type': 'folder'} ).count()

# public files
public_files = db.fs.files.find( {'type': 'file', 'global_public': True} ).count()

# shared files in groups
shared_groups = db.fs.files.find( {'type': 'file', 'public.groups.published': True} ).count()

# shared files in users
shared_users = db.fs.files.find( {'type': 'file', 'public.users.published': True} ).count()

# unique shared files (groups or users)
unique_shared = db.fs.files.find( {'$or': [ {'type': 'file', 'public.users.published': True}, {'type':'file', 'public.groups.published': True} ]} ).count()

# used space
space = 0
for us in db.user_fs.find( {'used_space': { '$ne' : 0 }}, ['used_space'] ):
	space += us['used_space']

# convert to human readable form
SUFFIXES = {1000: ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            1024: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']}

# function taken from diveintopython3
def approximate_size(size, a_kilobyte_is_1024_bytes=True):
    '''Convert a file size to human-readable form.

    Keyword arguments:
    size -- file size in bytes
    a_kilobyte_is_1024_bytes -- if True (default), use multiples of 1024
                                if False, use multiples of 1000

    Returns: string

    '''
    if size < 0:
        raise ValueError('number must be non-negative')

    multiple = 1024 if a_kilobyte_is_1024_bytes else 1000
    for suffix in SUFFIXES[multiple]:
        size /= multiple
        if size < multiple:
            return '{0:.1f} {1}'.format(size, suffix)

    raise ValueError('number too large')


# print stats

print '========================================'
print '=    Web File Manager MongoDB Stats    ='
print '========================================'
print
print 'users...................... : %d' % users
print 'files...................... : %d' % files
print 'folders.................... : %d' % folders
print 'public files............... : %d' % public_files
print 'files shared with groups... : %d' % shared_groups
print 'files shared with users.... : %d' % shared_users
print 'total (unique) shared files : %d' % unique_shared
print 'total used space........... : %s' % approximate_size(long(space))
print


# vim: ts=4 sw=4 et:

