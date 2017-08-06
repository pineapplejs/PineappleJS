# 🍍 PineappleJS Controller Class

In PineappleJS, A Controller is an object that can modify the response for a page. The main purpose of Controllers is creating dynamic content and accessing request properties.

## Cookies
To set or get cookies using a controller use the ``Cookie`` method.

Arguments:

| index | types    | description                 |
| ----- | -------- | --------------------------- |
| 0     | `String` | The name of the cookie.     |
| 1     | `String` | The value of the cookie.    |
| 2     | `Object` | Cookie options. Read below. |

To get a cookie, use:
```
Controller.Cookie(NAME_OF_COOKIE);
```
### Note
When `Get`ing a cookie, the `Cookie` method will return the current state of the cookie.
Meaning, if a cookie the request sent was reset, It will return its latest value.

To set a cookie, use:
```
Controller.Cookie( NAME_OF_COOKIE, VALUE_OF_COOKIE[, COOKIE_OPTIONS] );
```
Cookie options:

| name       | description                             | types                    |
| ---------- | --------------------------------------- | ------------------------ |
| `Expires`  | The cookie's expiry date.               | `Date`,`Number`,`String` |
| `MaxAge`   | The cookie's max age.                   | `String`,`Number`        |
| `Domain`   | The cookie's domain.                    | `String`                 |
| `Path`     | The cookie's path.                      | `String`                 |
| `Secure`   | HTTP Cookie Secure attribute.           | `Boolean`                |
| `HttpOnly` | HTTP Cookie HttpOnly attribute.         | `Boolean`                |
| `Action`   | Set to `"Delete"` to delete the cookie. | `String`                 |

## Headers
### Request headers
To get request headers use the ``RequestHeader`` method.
Usage:
```
Controller.RequestHeader(NAME_OF_HEADER);
```

### Response headers
To get, set, or delete response headers use the ``Header`` method.

To get a header use:
```
Controller.Header(NAME_OF_HEADER);
```
To set a header use:
```
Controller.Header(NAME_OF_HEADER, VALUE_OF_HEADER);
```
To delete a header use:
```
Controller.Header(NAME_OF_HEADER,"",{
    Action:"Delete"    
});
```

## Status
To get or set the response status code use the ``Status`` method.

To get the status use:
```
Controller.Status();
```

To set the status use:
```
Controller.Status(STATUS_CODE);
```

## Encoding
To get or set the response encoding use the ``Encoding`` method.

To get the encoding use:
```
Controller.Encoding();
```

To set the encoding use:
```
Controller.Encoding(ENCODING_NAME);
```

## Write
To write to the response body or set the response body use the ``Write`` method.

To write to the response body use:
```
Controller.Write(STRING_TO_WRITE);
```

To set the response body use:
```
Controller.Write(RESPONSE_BODY,"=");
```

## Serve
To serve files or error pages or get what's about to be served use the ``Serve`` method.

To serve a file use:
```
Controller.Serve(PATH_TO_FILE);
```

To serve an error page use:
```
Controller.Serve(ERROR_CODE);
```

To get the file or error page that's about to be served use:
```
Controller.Serve();
```

## Message
To get or set the response message use the ``Message`` method.

To get the response message use:
```
Controller.Message();
```

To set the response message use:
```
Controller.Message(HTTP_MESSAGE);
```

## Backend
To get the backend scope, or set or get a backend variable use the ``Backend`` method.

To get the backend scope use:
```
Controller.Backend();
```

To get a backend variable use:
```
Controller.Backend(NAME_OF_VARIABLE);
```

To set a backend variable use:
```
Controller.Backend(NAME_OF_VARIABLE,VALUE_OF_VARIABLE);
```
For further information read ``Backend.md``.

## Path
To get the requested path use the ``Path`` property.
Usage:
```
Controller.Path
```

## GET
To get the URL parameters use the ``GET`` property.
Usage:
```
Controller.GET
```

## Data
To get the request data (POST,PUT,DELETE etc.) use the ``Data`` property.
Usage:
```
Controller.Data
```

## Method
To get the HTTP method used to make the request use the ``Method`` property.
Usage:
``
Controller.Method
``

## URL
To get the full page URL use the ``URL`` property.
Usage:
```
Controller.URL
```

## Request
To get the bare request (``IncomingMessage``) use the ``Request`` property.
Usage:
```
Controller.Request
```

## Headers
To get the current state of the response headers use the ``Headers`` property.
Usage:
```
Controller.Headers
```

## Cookies
To get the current state of the cookies use the ``Cookies`` property.
Usage:
```
Controller.Cookies
```

## CookiesToSet
To only get the new cookies use the ``CookiesToSet`` property.
Usage:
```
Controller.CookiesToSet
```

## Content
To get the current state of the response body use the ``Content`` property.
Usage:
```
Controller.Content
```

## RequestHeaders
To get the request headers use the ``RequestHeaders`` property.
Usage:
```
Controller.RequestHeaders
```
