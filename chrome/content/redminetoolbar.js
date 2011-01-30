var RedmineToolbar= {

  urlExists : false,

  redmineToolbarPrefListener : null,
  
  Init : function() {
    // Initialize and register preferences listener
    RedmineToolbar.redmineToolbarPrefListener = new RedmineToolbar.PrefListener("extensions.redminetoolbar.",
      function(branch, name) {
        switch (name) {
          case "currentproject":
            RedmineToolbar.Change_Project_Label(); 
            break;
        }
    });
    RedmineToolbar.redmineToolbarPrefListener.register();
    
    // Set the project title to be the current project title
    RedmineToolbar.Change_Project_Label();
  },

  Change_Project_Label : function() {
    var projButton = document.getElementById('RedmineToolbar-Project-Button');
    if (projButton)
       projButton.setAttribute('label', RedmineToolbar.getPref('currentproject'));
  },

  Exit : function() {
  },

  loadUrl : function(url) {
    window._content.document.location = url;
    window.content.focus();
  },

  loadPage : function(page) {
    var url = "";
    var host = RedmineToolbar.getProjectUrl();
    var currProj = RedmineToolbar.getPref('currentproject');
    
    switch(page) {
      case 'MYPAGE':
        url = host + "/my/page";
        break;
      case 'OVERVIEW':
        url = host + "/projects/show/" + currProj + "";
        break;
      case 'ISSUES':
        url = host + "/projects/" + currProj + "/issues";
        break;
      case 'NEWISSUE':
        url = host + "/projects/" + currProj + "/issues/new";
        break;
      case 'NEWS':
        url = host + "/projects/" + currProj + "/news";
        break;
      case 'DOCS':
        url = host + "/projects/" + currProj + "/documents";
        break;
      case 'WIKI':
        url = host + "/wiki/" + currProj + "";
        break;
      case 'FILES':
        url = host + "/projects/list_files/" + currProj + "";
        break;
      case 'REPOSITORY':
        url = host + "/repositories/show/" + currProj + "";
        break;
      default:
        alert('No such page: ' + page);
    }
    RedmineToolbar.loadUrl(url);
  },

  getFeed : function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4) {
        if(xhr.status == 200) {
          RedmineToolbar.Populate(xhr.responseXML);
        }
      }
    }
    xhr.send(null);
  },

  PopulateActivities : function() {
    var host = RedmineToolbar.getProjectUrl();
    var currProj = RedmineToolbar.getPref('currentproject');
    var url = host + "/projects/activity/" + currProj + "?format=atom";
    if (RedmineToolbar.UrlExists(url)) {
			RedmineToolbar.getFeed(url);
		} else {
			url = host + "/projects/" + currProj + "/activity.atom";
			RedmineToolbar.getFeed(url);
		}
  },

  UrlExists : function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("HEAD", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
			  if (xhr.status == 200) {
					RedmineToolbar.urlExists = true;
				}
			}
		}
		xhr.send(null);
		return RedmineToolbar.urlExists;
	},

  Populate : function(doc) {
    // Maximum number of menu items
    const MAXENTRIES = 30;

    // Get the menupopup element that we will be working with
    var menu = document.getElementById("RedmineToolbar-Activity-Popup");

    // Remove all exisiting items first, otherwise the newly created items
    // are appended to the list
    for (var i=menu.childNodes.length - 1; i >= 0; i--) {
      menu.removeChild(menu.childNodes.item(i));
    }

    var resolver = function() { return 'http://www.w3.org/2005/Atom'; };
    var entryElements = doc.evaluate('//myns:entry', doc, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    nbEntries = (entryElements.snapshotLength > MAXENTRIES) ? MAXENTRIES : entryElements.snapshotLength;
    for (var i=0; i < nbEntries; i++) {
      // Get the single item
      var entryItem = entryElements.snapshotItem(i);

      // Create a new menu item to be added
      var tempItem = document.createElement("menuitem");
      
      // Get the label from the feed entry
      var title = entryItem.getElementsByTagName('title')[0].firstChild.nodeValue; 

      // Set the new menu item's label
      tempItem.setAttribute("label", title);
      
      // Add a menu icon
      if (RedmineToolbar.StartsWith(title, "Wiki edit"))
        tempItem.setAttribute("class", "RedmineToolbar-Activity-Wiki-Edit");
      else if (RedmineToolbar.StartsWith(title, "Revision")) 
        tempItem.setAttribute("class", "RedmineToolbar-Activity-Changeset");
      else if (RedmineToolbar.StartsWith(title, "Feature")) 
        tempItem.setAttribute("class", "RedmineToolbar-Activity-Feature");
      else if (RedmineToolbar.StartsWith(title, "Patch")) 
        tempItem.setAttribute("class", "RedmineToolbar-Activity-Patch");

      // get the URL from the feed entry
      var url = entryItem.getElementsByTagName('link')[0].getAttribute('href');

      // Set the new menu item's action
      tempItem.setAttribute("oncommand", "RedmineToolbar.loadUrl('" + url + "');");

      // Add the item to out menu
      menu.appendChild(tempItem);
    }
  },

  StartsWith : function(haystack, needle) {
    return haystack.substr(0, needle.length) === needle;
  },

  Wiki_Populate : function() {
    var menu = document.getElementById("RedmineToolbar-Wiki-Popup");

    // Remove all exisiting items first, otherwise the newly created items
    // are appended to the list. Skip 
    var skipEntries = 3;
    for (var i=menu.childNodes.length - 1; i >= skipEntries; i--) {
      menu.removeChild(menu.childNodes.item(i));
    }

    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.redminetoolbar.project." + RedmineToolbar.getPref("currentproject") + ".wikipage.");
    var children = branch.getChildList("", {});

    for (var j=children.length -1; j >= 0; j--) {
      var link = RedmineToolbar.getProjectUrl() + '/wiki/' + RedmineToolbar.getPref('currentproject') + '/' + branch.getCharPref(children[j]);
      var tempItem = document.createElement("menuitem");
      tempItem.setAttribute("label", branch.getCharPref(children[j]));
      var link = RedmineToolbar.getProjectUrl() + '/wiki/' + RedmineToolbar.getPref('currentproject') + '/' + branch.getCharPref(children[j]);
      tempItem.setAttribute("oncommand", "RedmineToolbar.loadUrl('" + link + "');");
      menu.appendChild(tempItem);
    }
  },

  getProjectUrl : function() {
    var currentProject = RedmineToolbar.getPref('currentproject');
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.redminetoolbar.projects.name");
    var children = branch.getChildList("", {});
    for (var i = 0; i < children.length; i++) {
    if (prefs.getCharPref("extensions.redminetoolbar.projects.name." + i) == currentProject)
      return prefs.getCharPref("extensions.redminetoolbar.projects.url." + i);
    }
	return "No project";
  },

  getPref : function(pref) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.redminetoolbar.");
    return branch.getCharPref(pref);
  },

  PopulateProjects : function() {
    var menu = document.getElementById("RedmineToolbar-Project-Popup");
    
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.redminetoolbar.projects.name");
    var children = branch.getChildList("", {});

    while (menu.hasChildNodes())
      menu.removeChild(menu.firstChild);

    for (var i = 0; i < children.length; i++) { 
      var tempItem = document.createElement("menuitem");
      var projectName = branch.getCharPref(children[i]);
      tempItem.setAttribute("label", projectName);
      tempItem.setAttribute("oncommand", "RedmineToolbar.Change_Project('" + projectName + "');");
      menu.appendChild(tempItem);
    }
  },

  Change_Project : function(projectName) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.redminetoolbar.");
    branch.setCharPref("currentproject", projectName);
  },

  showOptions : function() {
    var x = window.openDialog("chrome://redminetoolbar/content/options.xul",
      "Redmine Toolbar Options", "centerscreen=yes,chrome=yes,modal=yes,resizable=yes");
  },
  
  showWikipagesDialog : function() {
    var x = window.openDialog("chrome://redminetoolbar/content/wikipages.xul",
      "Redmine Toolbar Wikipages", "centerscreen=yes,chrome=yes,modal=yes,resizable=yes");
  },
  
  showAboutDialog : function() {
    var x = window.openDialog("chrome://redminetoolbar/content/about.xul",
      "Redmine Toolbar About", "centerscreen=yes,chrome=yes,modal=yes,resizable=yes");
  },

  PrefListener : function(branchName, func) {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch(branchName);
    branch.QueryInterface(Components.interfaces.nsIPrefBranch2);

    this.register = function() {
      branch.addObserver("", this, false);
      branch.getChildList("", { })
            .forEach(function (name) { func(branch, name); });
    };

    this.unregister = function unregister() {
      if (branch)
        branch.removeObserver("", this);
    };

    this.observe = function(subject, topic, data) {
      if (topic == "nsPref:changed")
        func(branch, data);
      };
  },

  jumpToTicket : function(event) {
    if (event.keyCode == 13) {
        var host = RedmineToolbar.getProjectUrl();
        var currProj = RedmineToolbar.getPref('currentproject');
        url = host + "/projects/" + currProj + "/issues/" + document.getElementById("RedmineToolbar-JumpToTicket-Textbox").value;
        RedmineToolbar.loadUrl(url);
    }
  }

}; // End of RedmineToolbar
