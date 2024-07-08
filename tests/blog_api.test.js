const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blog')
const app = require('../app')
const api = supertest(app)

const initialBlogs = [
    {
        title: 'blog 1',
        author: 'author 1',
        url: 'blog1.com',
        likes: 3
    }, {
        title: 'blog 2',
        author: 'author 2',
        url: 'blog2.com',
        likes: 5
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})

    let blog = new Blog(initialBlogs[0])
    await blog.save()
    blog = new Blog(initialBlogs[1])
    await blog.save()
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('unique identifier is named id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body

    assert(blogs[0].id)
})


describe('addition of new blog', () => {
    test('suceeds with valid data', async () => {
        const newBlog = {
            title: 'blog 3',
            author: 'author 3',
            url: 'blog3.com',
            likes: 1
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, initialBlogs.length + 1)
    })

    test('fails with status code 400 if data invalid', async () => {
        const newBlog = {
            title: 'blog 4'
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)

        const response = await api.get('/api/blogs')

        console.log(response.body.length, initialBlogs.length)
        assert.strictEqual(response.body.length, initialBlogs.length)
    })
})

after(async () => {
    await mongoose.connection.close()
})