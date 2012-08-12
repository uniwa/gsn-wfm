<?php
class CookieParser {
    public static function parse($cookiefile) {
        // read the file
        if(file_exists($cookiefile)) {
            $lines = file($cookiefile);

            // iterate over lines
            $cookies = array();
            foreach($lines as $line) {
                // we only care for valid cookie def lines
                if($line[0] != '#' && substr_count($line, "\t") == 6) {

                    // get tokens in an array
                    $tokens = explode("\t", $line);

                    // trim the tokens
                    $tokens = array_map('trim', $tokens);

                    $cookies[] = $tokens;
                }
            }
            return $cookies;
        } else {
            return false;
        }
    }
}
?>