UPDATE mysql.user SET authentication_string = PASSWORD('') WHERE User = 'root';
FLUSH PRIVILEGES;
