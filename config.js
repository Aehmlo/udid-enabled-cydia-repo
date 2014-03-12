module.exports = {
     //reload_interval: Interval in between reloading package info, in minutes. 0 disables.
     reload_interval : 30,
     //allow_unauthorized_access: If set to true, the repo is universally available,
     //but packages which are marked as restricted/have UDIDs associated with them
     //will only be visible to those whose UDIDs match; packages not marked as
     //restricted will be visible to everybody. If set to false, UDIDs which aren't
     //associated with any packages will be rejected, and those which are accepted
     //will be shown only packages which they are authorized for (or the "global" package).
     allow_unauthorized_access: true,
     //make_unspecified_packages_public: if true, packages not present in the packages.json
     //file will be assumed to be publicly visible. Set to false to make all packages private
     //unless otherwise specified,
     make_unspecified_packages_public: true,
     //enable_plain_packages_file: if true, will allow getting the plain /Packages file in
     //addition to the gzipped version. Still filtered by UDID. Good for debugging.
     enable_plain_packages_file: true,
     //database_type: 'json' is the only supported format right now.
     //sqlite and others will come soon.
     database_type: 'json',
     //database_filename: Filename to store the UDID database in/read it from (stored in lib).
     database_filename: 'udids',
     //allow_depiction_generation: defaults to true, but, if set to false, will disallow access
     //to depiction pages, regardless of individual package settings.
     allow_depiction_generation: true,
     //show_download_stats: global override for packages' local show_download_stats setting.
     show_download_stats: true,
     //port: port to listen on (default is 8080). Not used if 'export' is true.
     //I recommend using a non-priveleged port (above 1024) and using iptables
     //to reroute requests to port 80 to that port.
     port: 8088,
     //real_port: only set if you're using iptables or similar to redirect your ports.
     //Used for depiction URLs.
     //real_port: 80,
     //hostname: used only for depictions, no trailing slash.
     hostname: 'aehmlos-macbook-pro.local',
     //export: If set to true, module.exports is set to 'app', an express application.
     //This allows for easy use from other applications (e.g. for virtualhosts).
     //If set to false, it will simply listen on 'port' (or port 8080).
     export: false
}
