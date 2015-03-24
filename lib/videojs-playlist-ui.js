/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
const defaults = {
  className: 'vjs-playlist'
};

// Array#indexOf analog for IE8
const indexOf = function(array, target) {
  for (let i = 0, length = array.length; i < length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
};

const createThumbnail = function(thumbnail) {
  if (!thumbnail) {
    let placeholder = document.createElement('div');
    placeholder.className = 'vjs-playlist-thumbnail';
    return placeholder;
  }

  let picture = document.createElement('picture');
  picture.className = 'vjs-playlist-thumbnail';

  if (typeof thumbnail === 'string') {
    // simple thumbnails
    let img = document.createElement('img');
    img.src = thumbnail;
    picture.appendChild(img);
  } else {
    // responsive thumbnails

    // additional variations of a <picture> are specified as
    // <source> elements
    for (let i = 0; i < thumbnail.length - 1; i++) {
      let variant = thumbnail[i];
      let source = document.createElement('source');
      // transfer the properties of each variant onto a <source>
      for (let prop in variant) {
        source[prop] = variant[prop];
      }
      picture.appendChild(source);
    }

    // the default version of a <picture> is specified by an <img>
    let variant = thumbnail[thumbnail.length - 1];
    let img = document.createElement('img');
    for (let prop in variant) {
      img[prop] = variant[prop];
    }
    picture.appendChild(img);
  }
  return picture;
};

videojs.PlaylistMenuItem = videojs.Component.extend({
  init: function(player, options) {
    if (!options.item) {
      throw new Error('Cannot construct a PlaylistMenuItem without an item option');
    }
    // stub out the element so Component doesn't construct one
    options.el = true;
    videojs.Component.call(this, player, options);
    this.el_ = this.createEl(options.item);

    this.item = options.item;
    this.emitTapEvents();

    this.on(['click', 'tap'], (event) => {
      player.playlist.currentItem(indexOf(player.playlist(), this.item));
    });
  },
  createEl: function(item) {
    let li = document.createElement('li');
    li.className = 'vjs-playlist-item';

    // Thumbnail image
    li.appendChild(createThumbnail(item.thumbnail));

    // Duration
    if (item.duration) {
      let duration = document.createElement('time');
      let time = videojs.formatTime(item.duration);
      duration.className = 'vjs-playlist-duration';
      duration.setAttribute('datetime', 'PT0H0M' + item.duration + 'S');
      duration.appendChild(document.createTextNode(time));
      li.appendChild(duration);
    }

    // Name and description
    let name = document.createElement('cite');
    name.className = 'vjs-playlist-name';
    name.appendChild(document.createTextNode(item.name || this.localize('Untitled Video')));
    li.appendChild(name);

    if (item.description) {
      let description = document.createElement('p');
      description.className = 'vjs-playlist-description';
      description.appendChild(document.createTextNode(item.description));
      li.appendChild(description);
    }
    return li;
  }
});

videojs.PlaylistMenu = videojs.Component.extend({
  init (player, options) {

    if (!player.playlist) {
      throw new Error('videojs-playlist is required for the playlist component');
    }

    options = videojs.util.mergeOptions(options, defaults);

    if (!options.el) {
      this.el_ = document.createElement('ol');
      this.el_.className = options.className;
      options.el = this.el_;
    }

    videojs.Component.call(this, player, options);
    this.createPlaylist_();

    if (!videojs.TOUCH_ENABLED) {
      this.addClass('vjs-mouse');
    }

    player.on(['loadstart', 'playlistchange'], (event) => {
      this.update();
    });
  },
  createPlaylist_() {
    const playlist = this.player_.playlist() || [];

    // remove any existing items
    for (let i = 0; i < this.items.length; i++) {
      this.removeChild(this.items[i]);
    }
    this.items.length = 0;

    // create new items
    for (let i = 0; i < playlist.length; i++) {
      let item = new videojs.PlaylistMenuItem(this.player_, {
        item: playlist[i]
      });
      this.items.push(item);
      this.addChild(item);
    }

    // select the current playlist item
    let selectedIndex = this.player_.playlist.currentItem();
    if (this.items.length && selectedIndex >= 0) {
      this.items[selectedIndex].addClass('vjs-selected');
    }
  },
  items: [],
  update() {
    // replace the playlist items being displayed, if necessary
    const playlist = this.player_.playlist();
    if (this.items.length !== playlist.length) {
      // if the menu is currently empty or the state is obviously out
      // of date, rebuild everything.
      this.createPlaylist_();
      return;
    }
    for (let i = 0; i < this.items; i++) {
      if (this.items[i].item !== playlist[i]) {
        // if any of the playlist items have changed, rebuild the
        // entire playlist
        this.createPlaylist_();
        return;
      }
    }

    // the playlist itself is unchanged so just update the selection
    const currentItem = this.player_.playlist.currentItem();
    for (let i = 0; i < this.items.length; i++) {
      if (i === currentItem) {
        this.items[i].addClass('vjs-selected');
      } else {
        this.items[i].removeClass('vjs-selected');
      }
    }
  }
});

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
const playlistUi = function(options) {
  const player = this;
  let settings, elem;

  if (!player.playlist) {
    throw new Error('videojs-playlist is required for the playlist component');
  }

  // if the first argument is a DOM element, use it to build the component
  if ((typeof HTMLElement !== 'undefined' && options instanceof HTMLElement) ||
      // IE8 does not define HTMLElement so use a hackier type check
      (options && options.nodeType === 1)) {
    elem = options;
    settings = videojs.util.mergeOptions(defaults, {});
  } else {
    // lookup the elements to use by class name
    settings = videojs.util.mergeOptions(defaults, options);
    elem = document.querySelector('.' + settings.className);
  }

  // build the playlist menu
  settings.el = elem;
  player.playlistMenu = new videojs.PlaylistMenu(player, settings);
};

// register the plugin
videojs.plugin('playlistUi', playlistUi);