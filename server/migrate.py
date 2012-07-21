#!/usr/bin/env python2

import urllib2
import urllib
from BeautifulSoup import BeautifulSoup, SoupStrainer
import re
import sys
import os
import tempfile
import shutil

# define some global urls
BASE_URL = 'http://wfm.sch.gr/'
LOGIN_URL = '%slogin.php' % BASE_URL
ROOT_URL = 'index.php?order=1&cdir=/'
ROOT_URL_TRIMED = 'index.php?order=1&cdir='
USER_FILES = 'index.php?order=1&cdir=%2FMy+Files'

def traverse_web_links(url, ignore, contents, opener):
    # get html document from 'url'
    f = opener.open( url )
    data = f.read()
    f.close()

    # get curent folder from url
    current = url.split('/')[-1]

    # ignore current folder
    ignore.append( urllib.unquote(current).rstrip('/') )

    # set parce filter
    links = SoupStrainer('a', href=re.compile('order=1&cdir=|&file='))

    # traverse links
    for link in BeautifulSoup(data, parseOnlyThese=links):
        # get link reference url
        link_ref = link['href']

        # unquote url to check if we need to ignore it
        dec_link = urllib.unquote(link_ref).rstrip('/')

        if dec_link not in ignore:
            # if decoded link is directory then traverse
            if dec_link.split('?')[0] == 'index.php':
                #print DEBUG
                #print '==> going into %s' % link_ref DEBUG
                name = dec_link.split('/')[-1]
                contents.append( { 'type': 'folder', 'name': name, 'child':[] } )
                folder = '%s%s' % (BASE_URL, link_ref)
                traverse_web_links(folder, ignore, contents[-1]['child'], opener)
                #print '<== left %s' % link_ref DEBUG
                # remove folder from ignore list to save ram and speed
                ignore.pop()
            else:
                #print link_ref
                name = dec_link.split('&file=')[-1]
                contents.append( { 'type': 'file', 'url': link_ref, 'name': name } )

    return contents


def save_localy(contents, opener):
    for entry in contents:
    
        name = entry['name'].replace('+', '_')
        
        if entry['type'] is 'folder':
            os.mkdir(name)
            os.chdir(name)
            save_localy(entry['child'], opener)
            os.chdir('..')
        else:
            url = '%s%s' % (BASE_URL, entry['url'])
            # Open the url
            try:
                f = opener.open(url)
                #print "downloading " + url

                # Open our local file for writing
                local_file = open(name, "w")
                #Write to our local file
                local_file.write(f.read())
                local_file.close()
                f.close()

            #handle errors
            except urllib2.HTTPError, e:
                print "HTTP Error:",e.code , url
            except urllib2.URLError, e:
                print "URL Error:",e.reason , url


def wfm_old_login(username, password):
    # build opener with HTTPCookieProcessor
    opener = urllib2.build_opener( urllib2.HTTPCookieProcessor() )
    urllib2.install_opener(opener)

    # assuming the site expects 'user' and 'pass' as query params
    data = urllib.urlencode( { 'S_login': username, 'S_given_password': password } )

    # perform login with params
    f = opener.open(LOGIN_URL,  data)

    return opener


def cleanup(path):
    try:
        shutil.rmtree(path)
        return True
    except shutil.Error:
        return False


def migrate_wfm(username, password):
    # login and return the url opener
    opener = wfm_old_login(username, password)

    # ignore these links
    ignore_urls = []
    ignore_urls.append(ROOT_URL)
    ignore_urls.append(ROOT_URL_TRIMED)

    # here goes the tree structure
    contents = []

    # user's master folder
    user_url = '%s%s' % (BASE_URL, USER_FILES)

    # build content tree
    contents = traverse_web_links(user_url, ignore_urls, contents, opener)

    # go in /tmp and create a unique folder
    temp = tempfile.mkdtemp()
    os.chdir(temp)

    # save tree structure
    save_localy(contents, opener)

    # import to new wfm
    #wfm_import() TODO

    # remove tree structure
    cleanup(temp)


if __name__ == "__main__":
    #username = '********'
    #password = '********'
    #migrate_wfm(username, password)
    print 'migrate functions cannot run standalone, please import to wfm api'
