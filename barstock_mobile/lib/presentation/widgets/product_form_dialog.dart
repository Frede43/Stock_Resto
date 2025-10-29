import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/api_service.dart';

class ProductFormDialog extends StatefulWidget {
  final Map<String, dynamic>? product; // null pour création, non-null pour modification
  
  const ProductFormDialog({super.key, this.product});

  @override
  State<ProductFormDialog> createState() => _ProductFormDialogState();
}

class _ProductFormDialogState extends State<ProductFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  
  // Controllers
  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _barcodeController;
  late TextEditingController _purchasePriceController;
  late TextEditingController _sellingPriceController;
  late TextEditingController _currentStockController;
  late TextEditingController _minimumStockController;
  
  // State
  List<Map<String, dynamic>> _categories = [];
  int? _selectedCategoryId;
  String _selectedUnit = 'piece';
  bool _isActive = true;
  bool _isLoading = false;
  File? _imageFile;
  
  final List<String> _units = ['piece', 'kg', 'litre', 'gramme', 'ml'];
  
  @override
  void initState() {
    super.initState();
    
    // Initialiser les controllers avec les valeurs existantes si modification
    final product = widget.product;
    _nameController = TextEditingController(text: product?['name'] ?? '');
    _descriptionController = TextEditingController(text: product?['description'] ?? '');
    _barcodeController = TextEditingController(text: product?['barcode'] ?? '');
    _purchasePriceController = TextEditingController(
      text: product?['purchase_price']?.toString() ?? '',
    );
    _sellingPriceController = TextEditingController(
      text: product?['selling_price']?.toString() ?? '',
    );
    _currentStockController = TextEditingController(
      text: product?['current_stock']?.toString() ?? '0',
    );
    _minimumStockController = TextEditingController(
      text: product?['minimum_stock']?.toString() ?? '10',
    );
    
    _selectedCategoryId = product?['category'];
    _selectedUnit = product?['unit'] ?? 'piece';
    _isActive = product?['is_active'] ?? true;
    
    _loadCategories();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _barcodeController.dispose();
    _purchasePriceController.dispose();
    _sellingPriceController.dispose();
    _currentStockController.dispose();
    _minimumStockController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final response = await _apiService.get('/products/categories/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _categories = List<Map<String, dynamic>>.from(results);
          
          // Si pas de catégorie sélectionnée et qu'il y en a, sélectionner la première
          if (_selectedCategoryId == null && _categories.isNotEmpty) {
            _selectedCategoryId = _categories[0]['id'];
          }
        });
      }
    } catch (e) {
      print('❌ Erreur chargement catégories: $e');
    }
  }

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      
      if (image != null) {
        setState(() {
          _imageFile = File(image.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur sélection image: $e')),
        );
      }
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une catégorie')),
      );
      return;
    }
    
    setState(() => _isLoading = true);
    
    try {
      final productData = {
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'barcode': _barcodeController.text.trim(),
        'category': _selectedCategoryId,
        'purchase_price': double.parse(_purchasePriceController.text),
        'selling_price': double.parse(_sellingPriceController.text),
        'current_stock': int.parse(_currentStockController.text),
        'minimum_stock': int.parse(_minimumStockController.text),
        'unit': _selectedUnit,
        'is_active': _isActive,
      };
      
      print('📦 Données produit: $productData');
      
      final response = widget.product == null
          ? await _apiService.post('/products/', data: productData)
          : await _apiService.put('/products/${widget.product!['id']}/', data: productData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Produit sauvegardé');
        
        // Si une image a été sélectionnée, l'uploader
        if (_imageFile != null && response.data['id'] != null) {
          await _uploadImage(response.data['id']);
        }
        
        if (mounted) {
          Navigator.pop(context, true); // Retourner true pour indiquer le succès
        }
      }
    } catch (e) {
      print('❌ Erreur sauvegarde produit: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _uploadImage(int productId) async {
    if (_imageFile == null) return;
    
    try {
      // TODO: Implémenter l'upload d'image avec multipart/form-data
      print('📸 Upload image pour produit $productId');
      // final formData = FormData.fromMap({
      //   'image': await MultipartFile.fromFile(_imageFile!.path),
      // });
      // await _apiService.post('/products/$productId/upload-image/', data: formData);
    } catch (e) {
      print('❌ Erreur upload image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.product != null;
    
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
              child: Row(
                children: [
                  Icon(isEdit ? Icons.edit : Icons.add, color: Colors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isEdit ? 'Modifier le produit' : 'Nouveau produit',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            
            // Form
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image
                      Center(
                        child: GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey[400]!),
                            ),
                            child: _imageFile != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.file(_imageFile!, fit: BoxFit.cover),
                                  )
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.add_photo_alternate, size: 40, color: Colors.grey[600]),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Ajouter une image',
                                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Nom
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Nom du produit *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.label),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Le nom est obligatoire';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Description
                      TextFormField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Description',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.description),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      
                      // Catégorie
                      DropdownButtonFormField<int>(
                        value: _selectedCategoryId,
                        decoration: const InputDecoration(
                          labelText: 'Catégorie *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.category),
                        ),
                        items: _categories.map((category) {
                          return DropdownMenuItem<int>(
                            value: category['id'],
                            child: Text(category['name'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => _selectedCategoryId = value);
                        },
                        validator: (value) {
                          if (value == null) {
                            return 'La catégorie est obligatoire';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Code-barres
                      TextFormField(
                        controller: _barcodeController,
                        decoration: const InputDecoration(
                          labelText: 'Code-barres',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.qr_code),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Prix d'achat et de vente
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _purchasePriceController,
                              decoration: const InputDecoration(
                                labelText: 'Prix d\'achat *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.shopping_cart),
                                suffixText: 'BIF',
                              ),
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Obligatoire';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _sellingPriceController,
                              decoration: const InputDecoration(
                                labelText: 'Prix de vente *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.sell),
                                suffixText: 'BIF',
                              ),
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Obligatoire';
                                }
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Stock et unité
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _currentStockController,
                              decoration: const InputDecoration(
                                labelText: 'Stock actuel *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.inventory),
                              ),
                              keyboardType: TextInputType.number,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Obligatoire';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _selectedUnit,
                              decoration: const InputDecoration(
                                labelText: 'Unité *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.straighten),
                              ),
                              items: _units.map((unit) {
                                return DropdownMenuItem<String>(
                                  value: unit,
                                  child: Text(unit),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() => _selectedUnit = value!);
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Stock minimum
                      TextFormField(
                        controller: _minimumStockController,
                        decoration: const InputDecoration(
                          labelText: 'Stock minimum *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.warning),
                          helperText: 'Alerte si stock en dessous',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Obligatoire';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Actif/Inactif
                      SwitchListTile(
                        title: const Text('Produit actif'),
                        subtitle: const Text('Visible dans les ventes'),
                        value: _isActive,
                        onChanged: (value) {
                          setState(() => _isActive = value);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Actions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _isLoading ? null : () => Navigator.pop(context),
                    child: const Text('Annuler'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _saveProduct,
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(isEdit ? 'Modifier' : 'Créer'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
