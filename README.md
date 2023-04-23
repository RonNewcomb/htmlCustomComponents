# HTML Custom Components

I'm translating some Angular components to native, as a learning exercise.

Q: How should a native component talk to another which isn't an ancestor or descendent, in order to do "micro-frontend" with minimal coupling?
A: The caller/sender fires a custom event with a payload. The receiver/callee exposes a javascript method that accepts such a payload. Code on the root node ties the two together.

Q: How's it done with built-in components?
A: The only two "native components" that talk to other components are `label` and `form`. The former through a `for` attribute holding the id of the other component to whom to shift focus, and the latter via querySelector on the three component types with a `.value` property.

## running

In a command prompt (not Powershell) try `tsc --watch`. Needs IIS or other webserver.

## See also:

[The Many Ways of Templates in HTML Custom Elements](https://dev.to/ronnewcomb/the-many-ways-of-templates-in-html-custom-elements-41i7)  
[Missing the Message Bus in HTML Custom Elements (and Microfrontends in General)](https://dev.to/ronnewcomb/missing-the-message-bus-in-html-custom-elements-and-micro-frontends-in-general-1582)
