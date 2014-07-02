
# to execute all tests run:
#   $python2 /path/to/tests.py
#
# to run tests individually run:
#   $python2 /path/to/tests.py TestWfm.test_name
# e.g.:
#   $python2 tests.py TestWfm.test_cas_login
#

# Any tests related with testing resources
# can run *only* under /server directory 

from pywfm import *

from StringIO import StringIO
import unittest
import os
import Image
import hashlib
import mimetypes
import zipfile
import shutil


class TestWfm(unittest.TestCase):

    _CAS_SERVER = 'https://sso.sch.gr'
    _CAS_SERVICE = 'http://wfm.edu.teiath.gr'

    # quota for each user on the server
    _quota = 1000000000

    # valid users in database
    # 2 or more users *must* be in the list
    # change the values accordingly
    _users = ['xenofon', 'tlatsas', 'tkaretsos']

    # valid files for testing purposes
    # change the values accodringly
    _testdir = 'testing_resources'
    _files = {  'jpg': 'archer.jpg',
                'png': 'mushrooms.png',
                'gif': 'panic.gif',
                'txt': 'pywfm.py',
                'zip': 'resources.zip'  }

    # set required local dir and file names
    # dict values *must* contain the keyword 'tmp'
    # so that tearDown method works properly
    _temps = {  'file1': '%s/%s' % (_testdir, 'tmp_file1'),
                'file2': '%s/%s' % (_testdir, 'tmp_file2'),
                'dir'  : '%s/%s' % (_testdir, 'tmp_dir')   }


    def setUp(self):
        self.username = 'wfmtest2'
        self.wfm = WfmApi('wfmtest2', 'dk4-@pgc', self._CAS_SERVER, self._CAS_SERVICE)
        self.wfm.cas_login()
        self.wfm.wfm_init_calls()


    def tearDown(self):
        # delete permanently everything under home folder
        for entry in self.wfm.cmd_ls()['ls']['contents']:
            self.wfm.cmd_delete(entry['_id'], '1')

        # delete all created groups
        for entry in self.wfm.cmd_ls(doc_id='groups')['ls']['contents']:
            self.wfm.cmd_delete_group(entry['_id'])

        # delete all created tags
        for entry in self.wfm.cmd_ls(doc_id='tags')['ls']['contents']:
            self.wfm.cmd_delete_tags(entry['_id'])

        self.wfm.cmd_empty_trash()

        # local
        for item in os.listdir(self._testdir):
            if 'tmp' not in item: continue

            path = '%s/%s' % (self._testdir, item)
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)            


#====================== HELPER METHODS ======================#

    def _create_folder(self, name='foofolder', parent_id=None):
        """Helper function to make the creating
        folder operation transparent.

        Returns the folder name and its id.
        """
        if parent_id is None:
            return name, self.wfm.cmd_create_folder(name)['doc_id']
        else:
            return name, self.wfm.cmd_create_folder(name, parent_id)['doc_id']


    def _create_file(self, name=_files['txt'], parent_id=None):
        """Helper function to make the creating
        file operation transparent.

        Returns the file name, its local relative path and its id.
        """
        path = '%s/%s' % (self._testdir, name)
        if parent_id is None:
            f_id = self.wfm.cmd_create_file(path)['doc_id']
        else:
            f_id = self.wfm.cmd_create_file(path, parent_id)['doc_id']
        return name, path, f_id


    def _md5_check(self, file_path, block_size=None):
        md5 = hashlib.md5()
        if block_size is None:
            block_size = 128 * md5.block_size

        with open(file_path, 'rb') as f: 
            for chunk in iter(lambda: f.read(block_size), ''): 
                 md5.update(chunk)
            f.close()
        return md5.digest()

#======================= TEST METHODS =======================#

    def test_get(self):
        tmp_file = self._temps['file1']
        file_name, file_path, file_id = self._create_file(self._files['gif'])

        ret = self.wfm.get('fake_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.get('fake__id__that__is__33_chars_long')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.get(file_id)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['name'], file_name)
        self.assertEqual(ret['size'], os.path.getsize(file_path))
        self.assertEqual(ret['type'], mimetypes.guess_type(file_path)[0])
        # create a temporary local file to save the downloaded file
        temp = open(tmp_file, 'wb')
        temp.write(ret['data'])
        temp.close()
        self.assertEqual(self._md5_check(tmp_file), self._md5_check(file_path))


    def test_cmd_tree(self):
        ret = self.wfm.cmd_tree()
        self.assertTrue(ret['success'])

        node = {'type': 'root', '_id': 'root', 'name': 'root'}
        self.assertEqual(ret['tree']['node'], node)

        home = {'node': {'_id': self.wfm._wfm_home_id, 'name': 'home', 'type': 'schema'} , 'children': []}
        trash = {'node': {'_id': self.wfm._wfm_trash_id, 'name': 'trash', 'type': 'schema'} , 'children': []}
        public = {'node': {'type': 'schema', 'name': 'public', '_id': 'public'}, 'children': []}
        shared_contents = [ {'node': {'type': 'folder', 'name': 'users', '_id': 'users'}, 
                             'children': []}, 
                            {'node': {'type': 'folder', 'name': 'groups', '_id': 'groups'}, 
                             'children': []}    ]
        shared = {'node': {'type': 'schema', 'name': 'shared', '_id': 'shared'}, 'children': shared_contents}
        tags = {'node': {'_id': 'tags', 'name': 'tags', 'type': 'schema'}, 'children': []}
        bookmarks = {'node': {'_id': 'bookmarks', 'name': 'bookmarks', 'type': 'schema'}, 'children': []}
        children = [home, trash, public, shared, tags, bookmarks]
        self.assertEqual(ret['tree']['children'], children)

        self.assertEqual(ret['quota'], self._quota)
        self.assertEqual(ret['used_space'], 0)


    def test_cmd_ls(self):
        ret = self.wfm.cmd_ls()
        self.assertEqual(ret['success'], True)


    def test_cmd_create_folder(self):
        folder_name = 'foofolder'
        
        ret = self.wfm.cmd_create_folder('wrong<name;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_document_name')

        ret = self.wfm.cmd_create_folder(folder_name, 'fake_parent_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'parent_folder_does_not_exist')

        ret = self.wfm.cmd_create_folder(folder_name)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['status_msg'], 'folder_successfully_created')
        self.assertEqual(ret['name'], folder_name)


    def test_cmd_create_group(self):
        group_name = 'foogroup'
        
        ret = self.wfm.cmd_create_group('wrong<name;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_name_not_valid')

        ret_s = self.wfm.cmd_create_group(group_name)
        self.assertTrue(ret_s['success'])
        self.assertEqual(ret_s['name'], group_name)

        ret = self.wfm.cmd_create_group(group_name)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_exists')


    def test_cmd_delete_group(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']

        ret = self.wfm.cmd_delete_group(group_id)
        self.assertTrue(ret['success'])


    def test_cmd_get_group_membership(self):
        ret = self.wfm.cmd_get_group_membership()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['groups'], [])


    def test_cmd_get_groups(self):
        # see also test_cmd_add_to_group
        ret = self.wfm.cmd_get_groups()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['groups'], [])


    def test_cmd_get_group_users(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']

        ret = self.wfm.cmd_get_group_users('fake_group_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_not_found')

        ret = self.wfm.cmd_get_group_users(group_id)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['users'], [])


    def test_cmd_group_rename(self):
        group_name1 = 'foogroup'
        group_name2 = 'bargroup'
        group_name3 = 'existing_group'
        group_id = self.wfm.cmd_create_group(group_name1)['group_id']
        existing_group_id = self.wfm.cmd_create_group(group_name3)['group_id']

        ret = self.wfm.cmd_group_rename(group_id, 'wrong<name;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_name_not_valid')

        # give it a name of another existing group
        ret = self.wfm.cmd_group_rename(group_id, group_name3)
        self.assertFalse(ret['success']) # test will fail here until api fix
        # the status_msg is subject to change
        self.assertEqual(ret['status_msg'], 'group_exists')

        ret = self.wfm.cmd_group_rename(group_id, group_name2)
        self.assertTrue(ret['success'])


    def test_cmd_include_group(self):
        group_id1 = self.wfm.cmd_create_group('foogroup')['group_id']
        group_id2 = self.wfm.cmd_create_group('bargroup')['group_id']

        ret = self.wfm.cmd_include_group(group_id1, 'fake_group_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_not_found')

        ret = self.wfm.cmd_include_group('fake_group_id', group_id2)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'could_not_add_users_to_group')

        # include grp2 into grp1
        ret = self.wfm.cmd_include_group(group_id1, group_id2)
        self.assertTrue(ret['success'])


    def test_cmd_add_to_group(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']

        ret = self.wfm.cmd_add_to_group(group_id, 'fake/users/ids')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'user_not_found')

        ret = self.wfm.cmd_add_to_group('fake_group_id', '/'.join(self._users))
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'could_not_add_users_to_group')

        ret = self.wfm.cmd_add_to_group(group_id, '/'.join(self._users))
        self.assertTrue(ret['success'])
        group_users = self.wfm.cmd_get_group_users(group_id)['users']
        self.assertEqual(group_users.sort(), self._users.sort())


    def test_cmd_remove_from_group(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']
        self.wfm.cmd_add_to_group(group_id, '/'.join(self._users))
        # remove users: first and last of self._users
        rm_users = [self._users[0], self._users[len(self._users)-1]]
        users_left = self._users[1:len(self._users)-1]

        ret = self.wfm.cmd_remove_from_group(group_id, '/'.join(rm_users))
        self.assertTrue(ret['success'])
        group_users = self.wfm.cmd_get_group_users(group_id)['users']
        self.assertEqual(group_users, users_left)

        
    def test_cmd_get_userinfo(self):
        ret = self.wfm.cmd_get_userinfo()
        self.assertEqual(ret['success'], True)
        self.assertEqual(ret['username'], self.username)
        self.assertEqual(ret['name'], 'web file manager test_3')


    def test_cmd_set_bookmark_doc(self):
        folder_name, folder_id = self._create_folder()

        ret = self.wfm.cmd_set_bookmark_doc('not_existing_folder_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.cmd_set_bookmark_doc(folder_id)
        self.assertTrue(ret['success'])


    def test_cmd_get_bookmarks_doc(self):
        folder_name, folder_id = self._create_folder()

        self.wfm.cmd_set_bookmark_doc(folder_id)
        ret = self.wfm.cmd_get_bookmarks_doc()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['bookmarks'], [folder_id,])


    def test_cmd_remove_bookmark_doc(self):
        folder_name, folder_id = self._create_folder()

        self.wfm.cmd_set_bookmark_doc(folder_id)
        ret = self.wfm.cmd_remove_bookmark_doc(folder_id)
        self.assertTrue(ret['success'])


    def test_cmd_search_users(self):
        # user should exist
        ret = self.wfm.cmd_search_users(self.username, 'uid')
        self.assertTrue(ret['success'])
        
        # user should'n exist
        ret = self.wfm.cmd_search_users('somethingthatshouldntexist', 'uid')
        self.assertFalse(ret['success'])


    def test_add_del_tags(self):
        tag_list = ['tag1', 'tag2']

        # add tags
        ret_add = self.wfm.cmd_add_tags('bad<taglist;')
        self.assertFalse(ret_add['success'])
        self.assertEqual(ret_add['status_msg'], 'bad_taglist_argument')

        ret_add = self.wfm.cmd_add_tags('/'.join(tag_list))
        self.assertTrue(ret_add['success'])

        # check tags
        ret = self.wfm.cmd_get_tag_list()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['tag_list'], tag_list)

        # delete tags
        ret_del = self.wfm.cmd_delete_tags('bad<taglist;')
        self.assertFalse(ret_del['success'])
        self.assertEqual(ret_del['status_msg'], 'bad_taglist_argument')

        ret_del = self.wfm.cmd_delete_tags('/'.join(tag_list))
        self.assertTrue(ret_del['success'])


    def test_cmd_set_tags(self):
        folder_name, folder_id = self._create_folder()
        tag_list = ['tag1', 'tag2']
        self.wfm.cmd_add_tags('/'.join(tag_list))

        ret = self.wfm.cmd_set_tags(folder_id, 'bad<taglist;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_taglist_argument')

        ret = self.wfm.cmd_set_tags(folder_id, '/'.join(tag_list))
        self.assertTrue(ret['success'])
        self.assertEqual(self.wfm.cmd_get_tags(folder_id)['tag_list'].sort(), tag_list.sort())


    def test_cmd_get_tags(self):
        folder_name, folder_id = self._create_folder()
        tag_list = ['tag1', 'tag2']
        self.wfm.cmd_add_tags('/'.join(tag_list))

        ret = self.wfm.cmd_get_tags('fake_folder_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        self.wfm.cmd_set_tags(folder_id, '/'.join(tag_list))
        ret = self.wfm.cmd_get_tags(folder_id)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['tag_list'].sort(), tag_list.sort())


    def test_cmd_remove_tags(self):
        folder_name, folder_id = self._create_folder()
        tag_list = ['tag1', 'tag2']
        self.wfm.cmd_add_tags('/'.join(tag_list))

        ret = self.wfm.cmd_remove_tags(folder_id, 'bad>taglist;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_taglist_argument')

        self.wfm.cmd_set_tags(folder_id, '/'.join(tag_list))
        ret = self.wfm.cmd_remove_tags(folder_id, '/'.join(tag_list))
        self.assertTrue(ret['success'])
        self.assertEqual(self.wfm.cmd_get_tags(folder_id)['tag_list'], [])


    def test_cmd_empty_trash(self):
        ret = self.wfm.cmd_empty_trash()
        self.assertTrue(ret['success'])


    def test_cmd_create_file(self):
        file_name = self._files['txt']
        file_path = '%s/%s' % (self._testdir, file_name)

        ret = self.wfm.cmd_create_file('%s/bad;name' % self._testdir)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_document_name')

        ret = self.wfm.cmd_create_file(file_path, 'fake_parent_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'parent_folder_id_does_not_exist')

        ret = self.wfm.cmd_create_file(file_path)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['name'], file_name)
        self.assertEqual(ret['size'], os.path.getsize(file_path))


    def test_cmd_calculate_size(self):
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_calculate_size('fake_doc_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'could_not_find_doc')

        ret = self.wfm.cmd_calculate_size(file_id)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['size'], os.path.getsize(file_path))


    def test_cmd_get_image_size(self):
        file_name1, file_path1, file_id1 = self._create_file(self._files['jpg'])
        file_name2, file_path2, file_id2 = self._create_file(self._files['txt'])

        ret = self.wfm.cmd_get_image_size('fake_doc_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.cmd_get_image_size(file_id2)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_is_not_image')

        ret = self.wfm.cmd_get_image_size(file_id1)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['size'], list(Image.open(file_path1).size))


    def test_cmd_get_space(self):
        ret = self.wfm.cmd_get_space()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['total_space'], self._quota)
        self.assertEqual(ret['used_space'], 0)

        file_ids = []
        total_size = 0
        # upload files and check again
        for key in self._files.keys():
            fpath = '%s/%s' % (self._testdir, self._files[key])
            file_ids.append(self.wfm.cmd_create_file(fpath)['doc_id'])
            total_size += os.path.getsize(fpath)

        ret = self.wfm.cmd_get_space()
        self.assertTrue(ret['success'])
        self.assertEqual(ret['total_space'], self._quota)
        self.assertEqual(ret['used_space'], total_size)


    def test_cmd_rename(self):
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_rename(file_id, 'bad<name;')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_document_name')

        ret = self.wfm.cmd_rename('fake_doc_id', 'new_name')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.cmd_rename(self.wfm._wfm_home_id, 'new_home')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'cannot_rename_home_folder')

        ret = self.wfm.cmd_rename(file_id, 'new_name')
        self.assertTrue(ret['success'])


    def test_cmd_move(self):
        folder_name, folder_id = self._create_folder()
        file_name, file_path, file_id = self._create_file(self._files['gif'])

        ret = self.wfm.cmd_move('fake_file_id', folder_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'source_not_found')

        ret = self.wfm.cmd_move(file_id, 'fake_folder_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'destination_not_found_or_in_trash')

        ret = self.wfm.cmd_move(self.wfm._wfm_home_id, folder_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'cannot_move_document')

        ret = self.wfm.cmd_move(file_id, folder_id)
        self.assertTrue(ret['success'])


    def test_cmd_copy(self):
        folder_name, folder_id = self._create_folder()
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_copy('fake_file_id', folder_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'source_not_found')

        ret = self.wfm.cmd_copy(file_id, 'fake_folder_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'destination_not_found_or_in_trash')

        ret = self.wfm.cmd_copy(self.wfm._wfm_home_id, folder_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'cannot_copy_document')

        ret = self.wfm.cmd_copy(file_id, folder_id)
        self.assertTrue(ret['success'])


    def test_cmd_delete(self):
        file_name1, file_path1, file_id1 = self._create_file()
        file_name2, file_path2, file_id2 = self._create_file(self._files['gif'])

        id_list = '/'.join([file_id1, file_id2])
        ret = self.wfm.cmd_delete(id_list, '1')
        self.assertTrue(ret['success'])


    def test_cmd_restore(self):
        folder_name, folder_id = self._create_folder()
        file_name, file_path, file_id = self._create_file(parent_id=folder_id)

        ret = self.wfm.cmd_restore('fake_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_deleted')

        ret = self.wfm.cmd_restore(file_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_deleted')

        self.wfm.cmd_delete(file_id)
        ret = self.wfm.cmd_restore(file_id)
        self.assertTrue(ret['success'])

        self.wfm.cmd_delete(file_id)
        self.wfm.cmd_delete(folder_id)
        ret = self.wfm.cmd_restore(file_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'could_not_restore_parent_folder_deleted')


    def test_cmd_set_global(self):
        file_name1, file_path1, file_id1 = self._create_file()
        file_name2, file_path2, file_id2 = self._create_file(self._files['gif'])

        ret = self.wfm.cmd_set_global('/'.join([file_id1, file_id2]), '1')
        self.assertTrue(ret['success'])

        ret = self.wfm.cmd_set_global('/'.join([file_id1, file_id2]), '0')
        self.assertTrue(ret['success'])

        ret = self.wfm.cmd_set_global('fake/id', '1')
        self.assertFalse(ret['success'])


    def test_cmd_share_doc_user(self):
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_share_doc_user(file_id, 'fake_user')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'user_not_found')

        ret = self.wfm.cmd_share_doc_user('fake_id', self._users[0])
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_able_to_share')

        ret = self.wfm.cmd_share_doc_user(file_id, self._users[0])
        self.assertTrue(ret['success'])

        ret = self.wfm.cmd_share_doc_user(file_id, self._users[0])
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_able_to_share')


    def test_cmd_unshare_doc_user(self):
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_unshare_doc_user(file_id, self._users[0])
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        ret = self.wfm.cmd_unshare_doc_user('fake_id', self._users[0])
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        ret = self.wfm.cmd_unshare_doc_user(file_id, 'fake_user')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        self.wfm.cmd_share_doc_user(file_id, self._users[0])
        ret = self.wfm.cmd_unshare_doc_user(file_id, self._users[0])
        self.assertTrue(ret['success'])


    def test_cmd_share_doc_group(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']
        self.wfm.cmd_add_to_group(group_id, '/'.join(self._users))
        file_name, file_path, file_id = self._create_file()

        ret = self.wfm.cmd_share_doc_group(file_id, 'fake_group_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'group_not_found')

        ret = self.wfm.cmd_share_doc_group('fake_file_id', group_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_able_to_share')

        ret = self.wfm.cmd_share_doc_group(file_id, group_id)
        self.assertTrue(ret['success'])

        ret = self.wfm.cmd_share_doc_group(file_id, group_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found_or_not_able_to_share')

        
    def test_cmd_unshare_doc_group(self):
        group_id = self.wfm.cmd_create_group('foogroup')['group_id']
        self.wfm.cmd_add_to_group(group_id, '/'.join(self._users))
        file_name, file_path, file_id = self._create_file()
        
        ret = self.wfm.cmd_unshare_doc_group(file_id, group_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        ret = self.wfm.cmd_unshare_doc_group('fake_doc_id', group_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        ret = self.wfm.cmd_unshare_doc_group(file_id, 'fake_group_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_not_found')

        self.wfm.cmd_share_doc_group(file_id, group_id)
        ret = self.wfm.cmd_unshare_doc_group(file_id, group_id)
        self.assertTrue(ret['success'])


    def test_cmd_get_thumbnail(self):
        im_ext = 'gif'  # assign valid image extension
        # temporary files used by md5 helper function
        tmp_local = '%s.%s' % (self._temps['file1'], im_ext)
        tmp_remote = '%s.%s' % (self._temps['file2'], im_ext)
        file_name1, file_path1, file_id1 = self._create_file(self._files['txt'])
        file_name2, file_path2, file_id2 = self._create_file(self._files[im_ext])

        ret = self.wfm.cmd_get_thumbnail('fake/id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.cmd_get_thumbnail(file_id1)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_is_not_image')

        # create thumbnail and save it in temporary file
        image = Image.open(file_path2)
        if image.mode not in ('L', 'RGB'):
            image = image.convert('RGB')
        image.thumbnail((140,140), Image.ANTIALIAS)
        image.save(tmp_local)

        ret = self.wfm.cmd_get_thumbnail(file_id2)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['name'], 'thumb_' + file_name2)
        # save the downloaded thumb in a temporary file
        ret['image'].save(tmp_remote)
        self.assertEqual(self._md5_check(tmp_local), self._md5_check(tmp_remote))


    def test_cmd_get_thumb_size(self):
        file_name1, file_path1, file_id1 = self._create_file(self._files['txt'])
        file_name2, file_path2, file_id2 = self._create_file(self._files['jpg'])

        ret = self.wfm.cmd_get_thumb_size('fake/id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_does_not_exist')

        ret = self.wfm.cmd_get_thumb_size(file_id1)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'document_is_not_image')

        # create thumbnail
        image = Image.open(file_path2)
        if image.mode not in ('L', 'RGB'):
            image = image.convert('RGB')
        image.thumbnail((140, 140), Image.ANTIALIAS)

        ret = self.wfm.cmd_get_thumb_size(file_id2)
        self.assertTrue(ret['success'])
        self.assertEqual(ret['size'], list(image.size))
        

    def test_cmd_zip_files(self):
        zip_dir = self._temps['dir']
        os.mkdir(zip_dir)

        # upload files
        doc_id_list = []
        for key in self._files.keys():
            if key != 'zip':
                name, path, fid = self._create_file(self._files[key])
                doc_id_list.append(fid)
        doc_id_list = '/'.join(doc_id_list)

        ret = self.wfm.cmd_zip_files('fake/id/list', 'random.zip')
        self.assertFalse(ret['success']) # test will fail until api fix

        ret = self.wfm.cmd_zip_files(doc_id_list, 'bad;name>')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'bad_document_name')

        ret = self.wfm.cmd_zip_files(doc_id_list, 'random')
        self.assertTrue(ret['success'])

        # download the created zip file
        dl_zip = self.wfm.get(ret['doc_id'])
        tmp_zip = open(zip_dir + '/' + dl_zip['name'], 'wb')
        tmp_zip.write(dl_zip['data'])
        tmp_zip.close()

        # extract the downloaded zip file
        working_dir = os.getcwd()
        os.chdir(zip_dir)
        zf = zipfile.ZipFile(dl_zip['name'], 'r', zipfile.ZIP_DEFLATED)
        zf.extractall()
        zf.close()
        os.chdir(working_dir)

        # md5 check the extracted files with the original ones
        for key in self._files.keys():
            if key != 'zip':
                md5_local = self._md5_check(self._testdir + '/' + self._files[key])
                md5_remote = self._md5_check(zip_dir + '/' + self._files[key])
                self.assertEqual(md5_local, md5_remote)


    def test_cmd_extract(self):
        zip_name, zip_path, zip_id = self._create_file(self._files['zip'])
        txt_name, txt_path, txt_id = self._create_file()

        ret = self.wfm.cmd_extract('fake_id')
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'doc_not_found')

        ret = self.wfm.cmd_extract(txt_id)
        self.assertFalse(ret['success'])
        self.assertEqual(ret['status_msg'], 'doc_is_not_zip')

        ret = self.wfm.cmd_extract(zip_id)
        self.assertTrue(ret['success'])

        # get the ids of the extracted files
        docs = self.wfm.cmd_ls()['ls']['contents']
        ext_doc_ids = []
        for doc in docs:
            if doc['name'] != self._files['zip']:
                ext_doc_ids.append(doc['_id'])

        # download the extracted files
        dl_dir = self._temps['dir']
        os.mkdir(dl_dir)
        working_dir = os.getcwd()
        os.chdir(dl_dir)
        for doc_id in ext_doc_ids:
            dl = self.wfm.get(doc_id)
            f = open(dl['name'], 'wb')
            f.write(dl['data'])
            f.close()
        os.chdir(working_dir)

        # md5 check the downloaded files with the original ones
        for key in self._files.keys():
            if key != 'zip':
                md5_local = self._md5_check(self._testdir + '/' + self._files[key])
                md5_remote = self._md5_check(dl_dir + '/' + self._files[key])
                self.assertEqual(md5_local, md5_remote)


if __name__ == '__main__':
    unittest.main(verbosity = 2)


# vim: ts=4 sw=4 sts=4 et:
