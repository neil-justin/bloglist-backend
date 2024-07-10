const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({})
        .populate('user', { username: 1, name: 1 })

    response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
    const { title, author, url, likes, userId } = request.body
    const user = await User.findById(userId)
    console.log(user)
    const blog = new Blog({
        title,
        author,
        url,
        likes,
        user: user._id
    })

    try {
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)

        await user.save()
        response.status(201).json(savedBlog)
    } catch (error) {
        next(error)
    }
})

blogsRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, request.body, { new: true })
        response.json(updatedBlog)
    } catch (error) {
        next(error)
    }

})

module.exports = blogsRouter