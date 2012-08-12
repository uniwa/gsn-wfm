<?php

class WFMFile extends Sabre_DAV_File {

    private $myPath;
    private $myNode;
    private $parentNode;
    private $wfmapi;
    private $undeletable;

    function __construct($path, $node, $wfmapi, $parentNode, $undeletable = false) {

        $this->myPath = $path;
        $this->myNode = $node;
        $this->wfmapi = $wfmapi;
        $this->parentNode = $parentNode;
        $this->undeletable = $undeletable;
    }

    function getName() {

        return $this->myNode->name;
    }

    function get() {

        // Set headers
        header("Cache-Control: public");
        header("Content-Description: File Transfer");
        header("Content-Disposition: attachment; filename=".$this->getName());
        header("Content-Type: application/force-download");
        header("Content-Transfer-Encoding: binary");
        header("Content-length: ".$this->getSize());
        header("ETag: ".$this->myNode->_id);
        $this->wfmapi->get($this->myNode->_id); // No echo, this is printed directly by the get command
        die();
    }

    function getSize() {

        return $this->myNode->length;
    }

    function getETag() {

        return '"' . $this->myNode->_id . '"';
    }

    function delete() {
        if ($this->undeletable == true || $this->myNode->type !== 'file') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->delete($this->myNode->_id);
        }
    }

    function setName($name) {
        if ($this->undeletable == true || $this->myNode->type !== 'file') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->rename($this->myNode->_id, $name);
        }
    }

    function put($data) {
        $this->wfmapi->delete($this->myNode->_id);
        $this->wfmapi->create_file($this->parentNode->_id, $this->myNode->name, $data);
    }
}

class CurlStream {
    protected $buffer;

    function stream_open($path, $mode, $options, &$opened_path) {
        // Has to be declared, it seems...
        return true;
    }

    public function stream_write($data) {
        echo $data;
        flush();
        ob_flush();

        return strlen($data);
    }
}

// Register the wrapper
stream_wrapper_register("curlstream", "CurlStream")
    or die("Failed to register protocol");

?>