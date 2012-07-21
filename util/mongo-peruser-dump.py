#!/usr/bin/env python

# mongo-peruser-dump.py
#
#  for each user in a specified collection
#  dump all files physically on disk

import os
import sys
import time
import hashlib
from pymongo import Connection
from gridfs import GridFS

# database and collection names
database_name = 'database'
user_collection = 'user_fs'
fs_collection = 'fs.files'

# field names
username_field = 'owner'
type_field = 'type'
fname_field = 'name'
id_field = '_id'
md5_field = 'md5'
date_field = 'uploadDate'
file_type_field = 'file'

# backup_path
default_path = '/tmp/mongobak'

if len(sys.argv) > 1:
    backup_path = sys.argv[1]
else:
    backup_path = default_path

if not os.path.isdir(backup_path):
    print "backup directory '%s' does not exist" % backup_path
    sys.exit(1)

if not os.access(backup_path, os.W_OK):
    print "backup directory '%s' is not writable" % backup_path
    sys.exit(1)

# functions
def check_dates(filename, username, parent_id):
    '''compare mongodb file upload date with disk file update date
    return true on if update needed
    '''
    mongo_time = db[fs_collection].find_one(
                                  { username_field: username,
                                    type_field: file_type_field,
                                    fname_field: os.path.basename(filename),
                                    'parent_id': parent_id })[date_field]

    mongo_ts = time.mktime(mongo_time.timetuple())
    disk_ts = os.stat(filename).st_ctime

    return mongo_ts > disk_ts

def md5_for_file(f, block_size=2**20):
    '''read file chunks to generate md5sum
    return hexadecimal hash
    '''
    md5 = hashlib.md5()
    while True:
        data = f.read(block_size)
        if not data:
            break
        md5.update(data)
    return md5.hexdigest()

def check_md5(filename, username):
    '''compare mongodb file md5 with disk file md5
    return true on if update needed
    '''
    mongo_sum = db[fs_collection].find_one(
                                       { username_field: username,
                                         type_field: file_type_field,
                                         fname_field: os.path.basename(filename) })[md5_field]

    f = open(filename, 'r')
    disk_sum = md5_for_file(f)

    return mongo_sum != disk_sum


def save_file(id, filename, username):
    '''save file to disk using the gridfs obejct'''
    fpath = (backup_path, username, filename)
    f = gfs.get(id)
    nf = open(os.path.join(*fpath), 'w')
    nf.write(f.read())
    nf.close()


def mongo_to_disk(username, doc_list, destination):
    '''Transfer files/folders and subfiles from mongodb to filesystem

    argyments:
        username: username of user calling parent function
        doc_list: list of mongodb files/folders
        destination: folder in fs to save the contents
    '''
    #for doc_id in doc_list:
    for doc in doc_list:
        #doc = db.fs.files.find_one({'owner': username, '_id': doc_id , 'parent_id': {'$ne': 'root' } }, ['type', 'name'])

        #if not doc:
        #    continue

        full_path = os.path.join(destination, doc['name'])
        
        if doc['type'] == 'folder':
            if not os.path.exists(full_path):
                os.mkdir(full_path)

            sub_list_cursor = db.fs.files.find({'owner': username, 'parent_id': doc['_id']}, ['_id', 'type', 'name', 'parent_id'])
            sub_list = list([v for v in sub_list_cursor])
            
            mongo_to_disk(username, sub_list, full_path)
        else:
            if os.path.isfile(full_path):
                if needs_update(full_path, username, doc['parent_id']) is False:
                    continue
            fdata = gfs.get(doc['_id'])
            f = open(full_path, 'w')
            f.write(fdata.read())
            f.close()


# select which function to use
needs_update = check_dates
#needs_update = check_md5

# connecto to db
db = Connection()[database_name]
gfs = GridFS(db)


# get user list
users = []
for user in db[user_collection].find():
    users.append(user[username_field])

# check files and update
for user in users:
    # get user's home id
    user_home = db['user_fs'].find_one({'owner':user})['home_id']

    # get user's top level files and folders
    top_lvl_list = []
    for mongo_file in db.fs.files.find({'owner': user, 'parent_id': user_home}, ['type', 'name', 'parent_id']):
        top_lvl_list.append(mongo_file)

    # create backup path
    path = os.path.join(backup_path, user)
    if not os.path.exists(path):
        os.makedirs(path)

#    os.chdir(path)

    mongo_to_disk(user, top_lvl_list, path)

#    disk_files = os.listdir(path)

#    for mongo_file in db[fs_collection].find({username_field: user, type_field: file_type_field}):
#        if mongo_file[fname_field] in disk_files:
#            if needs_update(mongo_file[fname_field], user) is False:
#                continue
#        save_file(mongo_file[id_field], mongo_file[fname_field], user)


# vim: set sw=4 ts=4 et:
