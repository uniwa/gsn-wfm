<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

class WfmApi {
    protected $wfmloc;
    protected $cookiejar;
    
    function url()
    {
        $s = empty($_SERVER["HTTPS"]) ? '' : ($_SERVER["HTTPS"] == "on") ? "s" : "";
        $protocol = substr(strtolower($_SERVER["SERVER_PROTOCOL"]), 0, strpos(strtolower($_SERVER["SERVER_PROTOCOL"]), "/")) . $s;
        $port = ($_SERVER["SERVER_PORT"] == "80") ? "" : (":".$_SERVER["SERVER_PORT"]);
        return $protocol . "://" . $_SERVER['SERVER_NAME'] . $port;
    }

    public function __construct() {
        $basePath = dirname(dirname($_SERVER['SCRIPT_NAME']));
        $this->wfmloc = $this->url().$basePath.'server/';
        if(rand(1, 100) == 1) { // Clean the cache o=in approximately 1 out of every 100 requests
            $this->cleanCache();
        }
    }

    protected function getCurl() {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookiejar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookiejar);
        return $ch;
    }

    protected function cleanCache() { // Removes all files older than 30 days from the cache folder
        $path = 'cache/';
        if ($handle = opendir($path)) {
            while (false !== ($file = readdir($handle))) {
                if($file === '.' || $file === '..') {
                    continue;
                }
                if ((time()-filemtime($path.$file)) > 2592000) {
                    unlink($path . $file);
                }
            }
        }
    }

    function auth($username, $password) {
        $this->cookiejar = 'cache/' . $username . '_' . md5($password) . '_cookie.txt';
        require_once 'CookieParser.php';
        $cookies = CookieParser::parse($this->cookiejar);
        if ($cookies == false || ($cookies[0][4] - time()) < 0) { // Expiry is $cookies[0][4]
            // Expired
            $ch = $this->getCurl();
            curl_setopt($ch, CURLOPT_URL, "http://wfm.dnna.gr/server/cmd_login/");
            curl_setopt($ch, CURLOPT_POSTFIELDS, array('username' => $username, 'password' => $password));
            $result = json_decode(curl_exec($ch));
            curl_close($ch);
            if ($result->success != true) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    function ls($doc_id = 'root', $path = 'root') {
        $ch = $this->getCurl();
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "cmd_ls/");
        curl_setopt($ch, CURLOPT_POSTFIELDS, array('doc_id' => $doc_id, 'path' => $path, 'group_id' => ''));
        $result = json_decode(curl_exec($ch));
        curl_close($ch);
        return $result->ls;
    }

    function get($doc_id) {
        $fp = fopen("curlstream://wfmfilestream", "r+");
        $ch = $this->getCurl();
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "get/" . $doc_id . "/");
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_BUFFERSIZE, 256);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FILE, $fp);    // Data will be sent to our stream ;-)
        curl_exec($ch);
        curl_close($ch);
        fclose($fp);
    }

    function delete($doc_id) {
        $ch = $this->getCurl();
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "cmd_delete/");
        curl_setopt($ch, CURLOPT_POSTFIELDS, array('doc_id_list' => $doc_id, 'perm' => 0));
        json_decode(curl_exec($ch));
        curl_close($ch);
        return true;
    }

    function rename($doc_id, $newname) {
        $ch = $this->getCurl();
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "cmd_rename/");
        curl_setopt($ch, CURLOPT_POSTFIELDS, array('doc_id' => $doc_id, 'name' => $newname));
        json_decode(curl_exec($ch));
        curl_close($ch);
        return true;
    }

    function create_folder($doc_id, $newname) {
        $ch = $this->getCurl();
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "cmd_create_folder/");
        curl_setopt($ch, CURLOPT_POSTFIELDS, array('parent_id' => $doc_id, 'name' => $newname));
        json_decode(curl_exec($ch));
        curl_close($ch);
        return true;
    }

    function create_file($doc_id, $newname, $data) {
        $ch = $this->getCurl();
        $filename = 'cache/' . $newname;
        file_put_contents($filename, $data);
        curl_setopt($ch, CURLOPT_URL, $this->wfmloc . "cmd_create_file/");
        curl_setopt($ch, CURLOPT_POSTFIELDS, array('parent_id' => $doc_id, 'name' => $newname, 'file_data' => '@' . $filename));
        json_decode(curl_exec($ch));
        curl_close($ch);
        @unlink($filename);
        return true;
    }

}

// HTTP Auth
if (!isset($_SERVER['PHP_AUTH_USER'])) {
    header('WWW-Authenticate: Basic realm="WFM"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Authentication Required';
    exit;
} else {
    $wfmapi = new WfmApi();
    if (!$wfmapi->auth($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'])) {
        header('WWW-Authenticate: Basic realm="WFM"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Authentication Required'; // Invalid credentials
        exit;
    }
}

require 'lib/Sabre/autoload.php';
require 'WFMDirectory.php';
require 'WFMFile.php';
// Now we're creating a whole bunch of objects
// Change public to something else, if you are using a different directory for your files
$rootDirectory = new WFMDirectory('', $wfmapi->ls(), $wfmapi);

// The server object is responsible for making sense out of the WebDAV protocol
$server = new Sabre_DAV_Server($rootDirectory);

// If your server is not on your webroot, make sure the following line has the correct information
// $server->setBaseUri('/~evert/mydavfolder'); // if its in some kind of home directory
// $server->setBaseUri('/dav/server.php/'); // if you can't use mod_rewrite, use server.php as a base uri
// $server->setBaseUri('/'); // ideally, SabreDAV lives on a root directory with mod_rewrite sending every request to server.php
// The lock manager is reponsible for making sure users don't overwrite each others changes. Change 'data' to a different 
// directory, if you're storing your data somewhere else.
$lockBackend = new Sabre_DAV_Locks_Backend_File('data/locks');
$lockPlugin = new Sabre_DAV_Locks_Plugin($lockBackend);

$server->addPlugin($lockPlugin);

// All we need to do now, is to fire up the server
$server->exec();
?>