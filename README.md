# HTML Custom Components

I'm translating some Angular components to native, as a learning exercise.

Q: How should a native component talk to another which isn't an ancestor or descendent, in order to do "micro-frontend" with minimal coupling?
A: The caller/sender fires a custom event with a payload. The receiver/callee exposes a javascript method that accepts such a payload. Code on the root node ties the two together.

Q: How's it done with built-in components?
A: The only two "native components" that talk to other components are `label` and `form`. The former through a `for` attribute holding the id of the other component to whom to shift focus, and the latter via querySelector on the three component types with a `.value` property.
