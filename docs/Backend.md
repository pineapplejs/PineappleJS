# 🍍 PineappleJS Backend
PineappleJS has a built in templating library for server side templating. In addition to templating, to create dynamic content, you can use a special tag to run NodeJS scripts from within the served file.
Both the templating engine and the tag engine are running from the same scope. To pass variables to the scope from the main script, use the Controller ``Backend`` method (Read ``Controller.md``).

## Backend scope built in variables

| name         | description                                     | type         |
| ------------ | ----------------------------------------------- | ------------ |
| `Time`       | The current timestamp.                          | `Number`     |
| `Backend`    | The backend scope.                              | `Object`     |
| `PrettyJSON` | A function to generate pretty JSON.             | `Function`   |
| `Controller` | The response Controller. (Read `Controller.md`) | `Controller` |

## Notes
The backend functionality only works with ``Serve``.
By default the backend functionality only works with the following file extensions:

1. No file extension
2. `.html`
3. `.htm`
4. `.json`
5. `.xml`
6. `.txt`
7. `.yaml`
8. `.yml`
9. `.js`
10. `.css`

To make the functionality work with more file extensions do the following:
```
App.on(".FILE_EXTENSION",true);
```
Same goes for disabling backend functionality:
```
App.on(".FILE_EXTENSION",false);
```

## Templating
To reference a variable from the template use the variable name wrapped with two curly brackets.
Example:
```
{{ NAME_OF_VARIABLE }}
```
Anything within the curly brackets will be evaluated. This means it will output the result of the code, Meaning you can write any JavaScript expression inside the curly brackets.

### Template loop
To iterate over an array from the template do the following:
```
{{ iterator in array }}
	{{ iterator }} <!-- This is the current array item -->
{{ /iterator }}
```

### Notes

Backend templating is not enabled by default.

To enable it for all pages use:
```
App.set("templating",true);
```

To enable only for one page add a ``Template`` property and set it to true in the page object. Example:
```
App.on("/...",{
	// ...
	Template: true
	// ...
});
```

## Inner Scripts
To create inner scripts to run from served files (Not only HTML files) use the `<:Pineapple :>` tag. Anything between `<:Pineapple` and `:>` will be executed using the backend scope. By default it doesn't have any output. To output something use the `print` function. Example of file with an inner script:
```
<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<title>My Inner Script</title>
	</head>
	<body>
		The current timestamp is: <:Pineapple
			print( Time );
		:>
	</body>
</html>
```
