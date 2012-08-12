<?php

class WFMDirectory extends Sabre_DAV_Collection {

    private $myPath;
    private $myNode;
    private $wfmapi;

    function __construct($path, $node, $wfmapi) {

        $this->myPath = $path;
        $this->myNode = $node;
        $this->wfmapi = $wfmapi;
    }

    function getChildren() {
        $children = array();
        // Loop through the directory, and create objects for each node
        foreach ($this->myNode->contents as $node) {
            if($node->_id === 'shared') {
                continue;
            }
            $children[] = $this->getChild($node);
        }

        return $children;
    }

    function getChild($name) {
        if(is_string($name)) {
            $node = $this->findNode($name);
        } else {
            $node = $name;
        }

        // We have to throw a NotFound exception if the file didn't exist
        if ($node == false)
            throw new Sabre_DAV_Exception_NotFound('The file with name: ' . $name . ' could not be found');
        $path = $this->myPath . '/' . $node->name;

        if ($node->type === 'schema' || $node->type === 'user' || $node->type === 'folder') {
            return new WFMDirectory($path, $this->wfmapi->ls($node->_id, $path), $this->wfmapi);
        } else {
            if($this->myNode->_id === 'user') {
                $undeletable = true;
            } else {
                $undeletable = false;
            }
            return new WFMFile($path, $node, $this->wfmapi, $this->myNode, $undeletable);
        }
    }

    protected function findNode($name) {
        foreach($this->myNode->contents as $child) {
            if($child->name === $name) {
                return $child;
            }
        }
        return false;
    }

    function childExists($name) {
        if($this->findNode($name) != false) {
            return true;
        } else {
            return false;
        }
    }

    function getName() {
        return $this->myNode->name;
    }

    function delete() {
        if ($this->myNode->type !== 'folder' || $this->myNode->_id === 'user') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->delete($this->myNode->_id);
        }
    }

    function setName($name) {
        if ($this->myNode->type !== 'folder' || $this->myNode->_id === 'user') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->rename($this->myNode->_id, $name);
        }
    }

    function createDirectory($name) {
        if ($this->myNode->type === 'folder' && $this->myNode->_id !== 'user') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->create_folder($this->myNode->_id, $name);
        }
    }

    function createFile($name, $data = null) {
        if ($this->myNode->type === 'folder' && $this->myNode->_id !== 'user') {
            throw new Sabre_DAV_Exception_Forbidden('Permission denied to delete node');
        } else {
            return $this->wfmapi->create_file($this->myNode->_id, $name, $data);
        }
    }
}

?>