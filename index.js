var express = require("express"),
colors = require("colors"),
LineByLineReader = require('line-by-line'),
config = require("./config"),
packages = [],
zlib = require("zlib"),
stream = require("stream"),
packages_config = require("./lib/packages.json"),
udids = require("./lib/udids.json");
if(!config) config = {};

colors.setTheme({
     silly: 'rainbow',
     input: 'grey',
     verbose: 'cyan',
     prompt: 'grey',
     info: 'green',
     data: 'grey',
     help: 'cyan',
     warn: 'yellow',
     debug: 'blue',
     error: 'red'
});

var reload_packages = function(callback){
     var lr = new LineByLineReader('./Packages'),
     current = {},
     parsing_description = false,
     error = null;

     lr.on('error', function(err){
          if(callback) callback(err, null);
          else throw err;
     });

     lr.on('line', function(line){
          if(line===''){
               packages.push(current);
               current = {};
          }else if(line.indexOf(" ") == 0 && parsing_description) current.description.push(line.slice(1));
          else{
               parsing_description = false;
               if(line.indexOf("Package: ") == 0) current.package = line.slice(9);
               else if(line.indexOf("Name: ") == 0) current.name = line.slice(6);
               else if(line.indexOf("Version: ") == 0) current.version = line.slice(9);
               else if(line.indexOf("Architecture: ") == 0) current.architecture = line.slice(14);
               else if(line.indexOf("Installed-Size: ") == 0) current.installed_size = line.slice(16);
               else if(line.indexOf("Filename: ") == 0) current.filename = line.slice(10);
               else if(line.indexOf("Size") == 0) current.size = line.slice(6);
               else if(line.indexOf("MD5sum: ") == 0) current.md5sum = line.slice(8);
               else if(line.indexOf("Section: ") == 0) current.section = line.slice(9);
               else if(line.indexOf("Homepage: ") == 0) current.section = line.slice(10);
               else if(line.indexOf("Support: ") == 0) current.support = line.slice(9);
               else if(line.indexOf("Author: ") == 0){
                    var _author = line.slice(8);
                    if(_author.indexOf("<") < 0) current.author = _author;
                    else{
                         current.author = _author.slice(0, _author.indexOf("<")-1)
                         current.author_email = _author.slice(_author.indexOf("<")+1, _author.indexOf(">"));
                    }
               }else if(line.indexOf("Maintainer: ") == 0){
                    var _maintainer = line.slice(12);
                    if(_maintainer.indexOf("<") < 0) current.maintainer = _maintainer;
                    else{
                         current.maintainer = _maintainer.slice(0, _maintainer.indexOf("<")-1)
                         current.maintainer_email = _maintainer.slice(_maintainer.indexOf("<")+1, _maintainer.indexOf(">"));
                    }
               }else if(line.indexOf("Conflicts: ") == 0){
                    var _conflicts = line.slice(11);
                    var __conflicts = _conflicts.split(',');
                    for(var j; j<__conflicts.length; j++){
                         __conflicts[j] = __conflicts[j].trim();
                    }
                    current.conflicts = __conflicts;
               }else if(line.indexOf("Depends: ") == 0){
                    var _depends = line.slice(9);
                    var __depends = _depends.split(',');
                    for(var j = 0; j<__depends.length; j++){
                         __depends[j] = __depends[j].trim();
                    }
                    current.depends = __depends;
               }else if(line.indexOf("Description: ") == 0){
                    parsing_description = true;
                    current.description = [line.slice(13)];
               }else{
                    var field = line.slice(0, line.indexOf(":"));
                    if(!current.others) current.others=[];
                    current.others[field] = line.slice(line.indexOf(":")+2);
               }
          }
     });

     lr.on('end', function () {
          if(callback) callback(error, packages);
     });
}
reload_packages(function(err, packages){
     if(err) console.error(err.error);
     console.log(JSON.stringify(packages, null, " ").data);
});
if(config.reload_interval>0){
     setInterval(function(){
          reload_packages(function(err, packages){
               if(err) console.error(err.error);
               console.log(JSON.stringify(packages, null, " ").data);
          });
     }, 60000*config.reload_interval);
}

var get_depiction_url = function(package_id){
     var ret = "http://"+config['hostname'];
     if(config['port']!=80 && config['real_port']!=80){
          ret+=":";
          if(config['real_port']!=undefined) ret+=config['real_port'];
          else ret+=config['port'];
     }
     ret+="/depictions/"+package_id+"\n";
     return ret;
}

var get_packages_output = function(udid){
     var output = "";
     console.log("Getting output for UDID: "+udid);
     for(var i = 0, package; i<packages.length, package = packages[i]; i++){
          if(udid_is_allowed_to_see_package(udid, package.package)){
               if(package.package) output+="Package: "+package.package+"\n";
                    if(package.name) output+="Name: "+package.name+"\n";
               if(package.description){
                    output+="Description: "+package.description[0]+"\n";
                    for(var j = 1, line; j<package.description.length, line=package.description[j]; j++){
                         output+=" "+line+"\n";
                    }
               }
               if(packages_config[package.package] && packages_config[package.package]['depiction']){
                    output+="Depiction: "+get_depiction_url(package.package);
               }
               if(package.version) output+="Version: "+package.version+"\n";
               if(package.architecture) output+="Architecture: "+package.architecture+"\n";
               if(package.homepage) output+="Homepage: "+package.homepage+"\n";
               if(package.support) output+="Support: "+package.support+"\n";
               if(package.depends) output+="Depends: "+package.depends.join(', ')+"\n";
               if(package.conflicts) output+="Conflicts: "+package.conflicts.join(', ')+"\n";
               if(package.size) output+="Size: "+package.size+"\n";
               if(package.installed_size) output+="Installed-Size: "+package.installed_size+"\n";
               if(package.filename) output+="Filename: "+package.filename+"\n";
               if(package.md5sum) output+="MD5sum: "+package.md5sum+"\n";
               if(package.maintainer){
                    output+="Maintainer: "+package.maintainer;
                    if(package.maintainer_email)
                         output+=" <"+package.maintainer_email+">";
                    output+="\n";
               }
               if(package.author){
                    output+="Author: "+package.author;
                    if(package.author_email)
                         output+=" <"+package.author_email+">";
                    output+="\n";
               }
               if(package.section) output+="Section: "+package.section+"\n";
               if(package.others){
                    for (var field in package.others){
                         output+=field+": "+package.others[field]+"\n";
                    }
               }
          }
     }
     return output;
}

var udid_is_allowed_to_see_package = function(udid, package){
     var _package = packages_config[package];
     if(!_package) return config['unspecified_package_default'];
     else if(_package['protected'] && (!udids[udid] || !udids[udid]['packages'])) return false;
     else if(!_package['protected'] || udids[udid]['packages'].indexOf(package) > -1) return true;
     return false;
}

var write_gzip_data = function(req, res){
     res.header("Content-Type", "application/x-gzip");
     var s = new stream.Readable();
     //s._read = function noop() {};
     s.push(get_packages_output(req.get('x-unique-id')));
     s.push(null);
     gzip = zlib.createGzip();
     s.pipe(gzip).pipe(res);
}

var get_package = function(name){
     for(var i = 0, package; i<packages.count, package=packages[i]; i++){
          if(package.package==name) return package;
     }
     return null;
}

var render_package_depiction = function(req, res){
     var _package = req.params.package,
     package = get_package(_package);
     res.render("depiction", {
          pretty: false,
          package: package,
          pretty_description: package.description[0]+"<br /><br />"+package.description.slice(1).join('<br />').replace(/\n/g, ''),
          show_download_stats: config['show_download_stats'] && packages_config[package.package]['show_download_stats']
     });
}

var render_package_stats = function(req, res){
     var _package = req.params.package,
     package = get_package(_package);
     res.render("stats", {
          pretty: false,
          package: package
     });
}

var app = express();

app.set('port', config['port']);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded());

app.get('/Packages.gzip', write_gzip_data);
app.get('/Packages.gz', write_gzip_data);
app.get('/./Packages.gz', write_gzip_data);
app.get('/Packages', function(req, res){
     res.header("Content-Type", "text/plain");
     res.send(get_packages_output(req.get('x-unique-id')));
});

app.get('/depictions/:package', render_package_depiction);
app.get('/stats/:package', render_package_stats);

if(config.export) module.exports = app;
else{
     app.listen(app.get('port') || 8080);
}
