package com.geovannycode.recipe.service

import com.geovannycode.recipe.dto.CreateTagRequest
import com.geovannycode.recipe.dto.TagResponse
import com.geovannycode.recipe.entity.RecipeTag
import com.geovannycode.recipe.repository.RecipeTagRepository
import com.geovannycode.shared.exception.DuplicateResourceException
import com.geovannycode.shared.exception.ResourceNotFoundException
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TagService(
    private val tagRepository: RecipeTagRepository,
    private val slugGenerator: SlugGenerator
) {

    @Transactional(readOnly = true)
    @Cacheable(value = ["tags"], key = "'all'")
    fun getAllTags(): List<TagResponse> {
        return tagRepository.findTagsWithRecipes()
            .map { TagResponse.from(it) }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = ["tags"], key = "'popular'")
    fun getPopularTags(): List<TagResponse> {
        return tagRepository.findPopularTags()
            .take(20)
            .map { TagResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getTagBySlug(slug: String): TagResponse {
        val tag = tagRepository.findBySlug(slug)
            .orElseThrow { ResourceNotFoundException("Tag", "slug", slug) }
        return TagResponse.from(tag)
    }

    @Transactional
    @CacheEvict(value = ["tags"], allEntries = true)
    fun createTag(request: CreateTagRequest): TagResponse {
        if (tagRepository.findByNameIgnoreCase(request.name).isPresent) {
            throw DuplicateResourceException("Tag", "nombre", request.name)
        }

        val slug = slugGenerator.generateUnique(request.name) { tagRepository.existsBySlug(it) }

        val tag = RecipeTag(
            name = request.name,
            slug = slug
        )

        val saved = tagRepository.save(tag)
        return TagResponse.from(saved)
    }

    @Transactional
    @CacheEvict(value = ["tags"], allEntries = true)
    fun deleteTag(id: Long) {
        val tag = tagRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Tag", "id", id) }

        if (tag.recipeCount > 0) {
            throw IllegalStateException("No se puede eliminar un tag con recetas asociadas")
        }

        tagRepository.delete(tag)
    }

    @Transactional(readOnly = true)
    fun findByIds(ids: List<Long>): List<RecipeTag> {
        return tagRepository.findAllById(ids)
    }
}