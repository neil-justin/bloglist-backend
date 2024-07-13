const jwt = require('jsonwebtoken')

const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({})
        .populate('user', { username: 1, name: 1 })

    response.json(blogs)
})

const getTokenFrom = request => {
    const authorization = request.get('authorization')

    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '')
    }

    return null
}

blogsRouter.post('/', async (request, response, next) => {
    try {
        const { title, author, url, likes } = request.body
        const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
        console.log(decodedToken.id)

        if (!decodedToken.id) {
            return response.status(401)
                .json({ error: 'token invalid' })
        }

        const user = await User.findById(decodedToken.id)

        console.log(user)
        const blog = new Blog({
            title,
            author,
            url,
            likes,
            user: user._id
        })
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