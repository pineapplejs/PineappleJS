# 🍍 PineappleJS

+ [PineappleJS](#pineapplejs)
	+ [Constructor](#constructor)
	+ [Methods](#methods)
		+ [on](#on)
			+ [Add Page](#add-page)
			+ [Add Error Page](#add-error-page)
			+ [Add Event Listener](#add-event-listener)
			+ [Add Realm User](#add-realm-user)
			+ [Add An Alias](#add-an-alias)
			+ [Link File Extension With File Type](#link-file-extension-with-file-type)
			+ [Add Global Controller](#add-global-controller)
			+ [Enable Or Disable Backend Processing For A File Extension](#enable-or-disable-backend-processing-for-a-file-extension)
		+ [public](#public)
		+ [set](#set)
		+ [start](#start)
		+ [stop](#stop)

## Constructor
Create a new App using the Pineapple constructor.
```
const Pineapple = require("pineapplejs");
```
### HTTP
To create an HTTP only App:
```
const App = new Pineapple();
```

### HTTPS
To create an HTTP and HTTPS App:
```
const App = new Pineapple({
	protocol:"https",
	/* HTTPS OPTIONS HERE SUCH AS: */
	key:fs.readFileSync("path/to/key.pem"),
	cert:fs.readFileSync("path/to/cert.pem")
});
```

## Methods

### on
The `on` method has lots of different uses. They are all described below.

#### add page
Adding a page using the ``on`` method requires passing the following arguments:

| index | type     | description |
| ----- | -------- | ----------- |
| 0     | `String` | Page url    |
| 1     | `Object` | Page Object |

**NOTE**: The page URL must start with either `/` (For normal page) or `#` (For error page);

The Page Object consists of the following properties:

| name            | types                 | description                                                                        | default value           |
| --------------- | --------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| `CaseSensitive` | `Boolean`             | Specifies whether page url is case sensitive.                                      | `false`                 |
| `Accepts`       | `Array`               | An array of allowed HTTP methods for the page where `"*"` represents all methods.  | `["*"]`                 |
| `Realm`         | `String`              | The name of the HTTP Realm for the page. Used for HTTP Authentication.                  | Not present by default. |
| `Serve`         | `String` / `Number`   | String: Path to file to be served; Number: Error code for error page to be served; | Not present by default. |
| `Controller`    | `Function`            | A function that accepts a Controller as its first parameter. Read `Controller.md`. | `c=>{}`                 |
| `Response`      | `Object` / `Function` | All properties are described below.                                                | Described below.        |
| `Template`      | `Boolean`             | Specifies whether page should be treated as a template. Read `Backend.md`.         | `false`                 |

If the response object is a function it will run (and accept a single Controller argument) and can (optionally) return the response object (This method of generating responses is not recommended. The recommendation is to use the `Controller` property instead).

The Response Object consists of the following properties:

| name       | type                | description                                                                        | default value                      |
| ---------- | ------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| `Status`   | `Number`            | The HTTP Status Code.                                                              | `200`                          |
| `Content`  | `String`            | The Response Message Body.                                                         | `""`                           |
| `Headers`  | `Object`            | The Response Headers.                                                              | `{"Content-Type":"text/html"}` |
| `Encoding` | `String`            | The response encoding.                                                             | `"utf8"`                       |
| `Backend`  | `Object`            | A set of variables to be added to the backend scope. Read `Backend.md`.            | `{}`                           |
| `Serve`    | `String` / `Number` | String: Path to file to be served; Number: Error code for error page to be served; | Not present by default.        |

In addition to the table specified types, every property can be a function which accepts a single Controller argument and can (optionally) return an instance of the specified type that will be treated as the property's value (The recommendation is to use the page `Controller` property instead).

##### add error page
To override the PineappleJS default error pages, do the same as adding a regular page, but where the page URL goes, write `"#<ERROR CODE>"`. For instance, to add a `404` error page do the following:
```
App.on("#404",{
	Serve: require( "path" ).join( __dirname, "404_Error.html" )
});
```

#### add event listener
To add an event listener do the following:
```
App.on( event_name, handler );
```
Where `event_name` is the event's name and handler is the callback function.

List of events:

| name          | description                                           | callback arguments                                                                                     |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| start         | Triggers after the server starts                      | [ [ HTTP Server, ?HTTPS Server ], [ HTTP Port, ?HTTPS Port ] ]                                         |
| request       | Triggers after a request is sent                      | [ request(`IncomingMessage`) ]                                                                         |
| response      | Triggers after the server sends a response            | [ response(`ServerResponse`), Request URL, Data (Fields), Request Method, Request(`IncomingMessage`) ] |
| error         | Triggers after an HTTP error occurs                   | [ Error Code, request(`IncomingMessage`) ]                                                             |
| server_error  | Triggers after a server error occurs                  | [ Server Error ]                                                                                       |
| /&lt;path&gt; | Triggers after &lt;path&gt; is requested              | [ URL, Data (Fields), Request Method, Request ]                                                        |
| #&lt;code&gt; | triggers after HTTP Error &lt;code&gt; occurs         | [ Error Code, request(`IncomingMessage`) ]                                                             |


#### add realm user
To add a realm user (For HTTP Basic Authentication) do the following:
```
App.on( "|<REALM>", "<USERNAME>", "<PASSWORD>" );
```
Where `<REALM>` is the realm name,
	  `<USERNAME>` is the username,
  and `<PASSWORD>` is the password.

For example, to add to the realm `Admins` a user named `webmaster` with the password `AZBC123` do the following:
```
App.on("|Admins","webmaster","AZBC123");
```

#### add an alias

##### Static
To create a static alias do the following:
```
App.on("/<SOURCE_ADDRESS>","<TARGET_URL>");
```
Where `<SOURCE_ADDRESS>` is the address to be redirected
  and `<TARGET_URL>` is the URL `<SOURCE_ADDRESS>` will be redirected to.

##### Dynamic
A dynamic alias is an alias with a redirection that includes matching groups and URL parameters. For instance, i have a page located at `/search` that uses a URL parameter called `q` to search and i want every request sent to `/search/<QUERY>` (Where `<QUERY>` is the query for the search) to be redirected to `/search?q=<QUERY>`. To do so do the following:
```
App.on("/search/([A-Za-z0-9]+)","/search?q={{1}}");
```
This will redirect every search matching `/search/([A-Za-z0-9]+)` to `/search?q={{1}}` where `{{1}}` is the first matching group.
Within the target url, every number wrapped with two curly brackets will be replaced with the matching group of that number.

When creating an alias you can specify whether or not it's case sensitive using the third parameter (As a boolean). By default the alias is not case sensitive.

When creating an alias that redirects to a URL and not creating a mask to an inside page you can specify the HTTP redirection code to be sent using the fourth parameter (As a number that is either 301 or 302. Default is 301).

#### link file extension with file type
To link a file extension with a content type do the following:
```
App.on(".<FILE_EXTENSION>","<CONTENT_TYPE>");
```
Where `<FILE_EXTENSION>` is the file extension
  and `<CONTENT_TYPE>` is the content type.

**NOTE**: There are a lot of content types already included as built ins in PineappleJS. They are all at '/lib/ContentTypes.js'.

#### add global controller
A global controller is a function accepting a single controller argument and will always run before generating the response.
To add a global controller do the following:
```
App.on(c=>{
	// c is a controller
	// Do stuff here
});
```

#### enable or disable backend processing for a file extension
To enable or disable backend processing for a file extension do the following:
```
App.on(".<FILE_EXTENSION>",<ENABLE_OR_DISABLE>);
```
Where `<FILE_EXTENSION>` is the file extension
  and `<ENABLE_OR_DISABLE>` is a boolean specifying whether to enable or not.

**READ Backend.md**

### public
The `public` method makes a folder or file public.
It takes the following arguments:

| index | description             | required | default value                                                      |
| ----- | ----------------------- | -------- | ------------------------------------------------------------------ |
| 0     | Path to file of folder. | yes      | required.                                                          |
| 1     | URL path.               | no       | Name of file or folder.                                            |
| 2     | Index file.             | no       | `index.html` / `index.html` / `home.html` / `home.htm` (If exists) |

**NOTE**: Backend processing works the same with the `public` method. Read `Backend.md`.

### set
The `set` method changes the App config. The app config has the following properties:

| property         | description                                                                                                                                                                  | default value   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `port`           | The port for the http server to listen                                                                                                                                       | `80`            |
| `https_port`     | The port for the https server to listen                                                                                                                                      | `443`           |
| `auto_https`     | When true and https is available, automatically redirects http to https                                                                                                      | `true`          |
| `enable_HEAD`    | When true, every request sent using the HEAD method will be responded with an empty response body (Only headers)                                                             | `true`          |
| `enable_OPTIONS` | When true, every request sent using the OPTIONS method will be responded with an empty response containing only the "Allow" header which contains the supported HTTP methods | `true`          |
| `templating`     | When true, all pages will automatically be rendered as templates.                                                                                                            | `false`         |
| `host`           | The host to listen on.                                                                                                                                                       | `"127.0.0.1"`   |

To change a property do the following:
```
App.set( property_name, property_value );
```
Where `property_name` is the property's name and `property_value` is the property's value.

### start
The `start` method starts the app.

### stop
The `stop` method stops the server.
